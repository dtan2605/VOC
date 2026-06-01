using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using VocabularyService.API.Dtos;

namespace VocabularyService.API.Services;

public sealed class VocabularyAiService : IVocabularyAiService
{
    private readonly IHttpClientFactory _httpClientFactory;

    public VocabularyAiService(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    public async Task<VocabularyAiSuggestResponse> SuggestAsync(string word, CancellationToken cancellationToken = default)
    {
        var normalizedWord = word.Trim();
        if (string.IsNullOrWhiteSpace(normalizedWord))
        {
            throw new InvalidOperationException("Word is required for AI suggestion.");
        }

        // If GEMINI is configured, prefer it for richer suggestions
        var geminiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
        var geminiModel = Environment.GetEnvironmentVariable("GEMINI_MODEL") ?? "models/gemini-2.5-flash-lite";
        if (!string.IsNullOrWhiteSpace(geminiKey))
        {
            var gemini = await CallGeminiAsync(normalizedWord, geminiKey, geminiModel, cancellationToken);
            if (gemini is not null)
            {
                return gemini;
            }
        }

        var nlpClient = _httpClientFactory.CreateClient("nlp-service");
        var translationClient = _httpClientFactory.CreateClient("translation-service");

        var nlpPayload = await AnalyzeWordAsync(nlpClient, normalizedWord, cancellationToken);
        var providerNotes = new List<string> { "spaCy en_core_web_sm", "WordNet", "eng-to-ipa" };
        var translatedWord = await TryTranslateAsync(translationClient, normalizedWord, "en", "vi", cancellationToken);
        if (!string.Equals(translatedWord, normalizedWord, StringComparison.OrdinalIgnoreCase))
        {
            providerNotes.Add("Argos Translate");
        }

        var meaning = BuildMeaning(
            normalizedWord,
            nlpPayload.VietnameseMeanings,
            translatedWord,
            nlpPayload.EnglishDefinition,
            nlpPayload.EnglishDefinition is { Length: > 0 }
                ? await TryTranslateAsync(translationClient, nlpPayload.EnglishDefinition, "en", "vi", cancellationToken)
                : string.Empty);
        var meaningCandidates = BuildMeaningCandidates(
            normalizedWord,
            nlpPayload.VietnameseMeanings,
            translatedWord,
            nlpPayload.EnglishDefinition,
            nlpPayload.EnglishDefinition is { Length: > 0 }
                ? await TryTranslateAsync(translationClient, nlpPayload.EnglishDefinition, "en", "vi", cancellationToken)
                : string.Empty);

        var exampleDrafts = nlpPayload.Examples.Take(2).ToList();
        var translatedExamples = await Task.WhenAll(exampleDrafts.Select(async example =>
        {
            var translated = await TryTranslateAsync(translationClient, example.EnglishText, "en", "vi", cancellationToken);
            return translated == example.EnglishText ? string.Empty : translated;
        }));

        var examples = exampleDrafts
            .Select((example, index) => new UpsertExampleSentenceRequest
            {
                EnglishText = example.EnglishText,
                VietnameseMeaning = translatedExamples[index],
                DisplayOrder = index + 1
            })
            .ToList();

        return new VocabularyAiSuggestResponse
        {
            Word = nlpPayload.Word,
            Meaning = meaning,
            MeaningCandidates = meaningCandidates,
            PartOfSpeech = nlpPayload.PartOfSpeech,
            Pronunciation = nlpPayload.Ipa,
            Lemma = nlpPayload.Lemma,
            EnglishDefinition = nlpPayload.EnglishDefinition,
            ProviderSummary = string.Join(" + ", providerNotes.Distinct()),
            RelatedForms = nlpPayload.RelatedForms
                .Select(form => new RelatedWordFormDto
                {
                    Word = form.Word,
                    PartOfSpeech = form.PartOfSpeech,
                })
                .ToList(),
            Synonyms = UniqueInOrder(nlpPayload.Synonyms.Select(s => s.Word))
                .Take(8)
                .ToList(),
            Examples = examples,
            BandLevel = DetermineBandLevel(nlpPayload.Word),
            TopicName = DetermineTopicName(nlpPayload.Word, nlpPayload.EnglishDefinition, meaning),
            BandConfidence = CalculateBandConfidence(nlpPayload.Word),
            TopicConfidence = CalculateTopicConfidence(nlpPayload.Word, nlpPayload.EnglishDefinition, meaning)
        };
    }

    private async Task<VocabularyAiSuggestResponse?> CallGeminiAsync(string word, string apiKey, string model, CancellationToken cancellationToken)
    {
        try
        {
            using var client = _httpClientFactory.CreateClient();
            var url = $"https://generativelanguage.googleapis.com/v1beta2/{model}:generateText?key={apiKey}";
            var prompt = $"Provide a JSON object with keys: bandLevel (number), topicName (short), meaning (one-sentence), pronunciation (IPA or simple), example (one short sentence). Word: {word}\\nJSON:";
            var payload = new { prompt = new { text = prompt }, maxOutputTokens = 256, temperature = 0.2 };
            var resp = await client.PostAsJsonAsync(url, payload, cancellationToken);
            resp.EnsureSuccessStatusCode();
            var body = await resp.Content.ReadAsStringAsync(cancellationToken);

            // Try to extract JSON object from response text
            var start = body.IndexOf('{');
            var end = body.LastIndexOf('}');
            JsonDocument? jd = null;
            if (start >= 0 && end > start)
            {
                var jsonPart = body[start..(end + 1)];
                try
                {
                    jd = JsonDocument.Parse(jsonPart);
                }
                catch
                {
                    jd = null;
                }
            }

            if (jd is null)
            {
                // try parse full JSON response for candidates
                try
                {
                    var doc = JsonDocument.Parse(body);
                    if (doc.RootElement.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
                    {
                        var first = candidates[0];
                        if (first.ValueKind == JsonValueKind.Object && first.TryGetProperty("content", out var content))
                        {
                            var text = content.GetString() ?? string.Empty;
                            var s = text.IndexOf('{');
                            var e = text.LastIndexOf('}');
                            if (s >= 0 && e > s)
                            {
                                jd = JsonDocument.Parse(text[s..(e+1)]);
                            }
                        }
                    }
                }
                catch
                {
                    jd = null;
                }
            }

            if (jd is null) return null;

            var root = jd.RootElement;
            string meaning = root.TryGetProperty("meaning", out var m) ? m.GetString() ?? string.Empty : string.Empty;
            string pronunciation = root.TryGetProperty("pronunciation", out var p) ? p.GetString() ?? string.Empty : string.Empty;
            int bandLevel = root.TryGetProperty("bandLevel", out var b) && b.TryGetInt32(out var bi) ? bi : 0;
            string topicName = root.TryGetProperty("topicName", out var t) ? t.GetString() ?? string.Empty : string.Empty;
            var example = root.TryGetProperty("example", out var ex) ? ex.GetString() ?? string.Empty : string.Empty;

            return new VocabularyAiSuggestResponse
            {
                Word = word,
                Meaning = meaning,
                Pronunciation = pronunciation,
                ProviderSummary = "gemini",
                Examples = string.IsNullOrWhiteSpace(example) ? new List<UpsertExampleSentenceRequest>() : new List<UpsertExampleSentenceRequest> { new UpsertExampleSentenceRequest { EnglishText = example, VietnameseMeaning = string.Empty, DisplayOrder = 1 } },
                BandLevel = bandLevel > 0 ? bandLevel : DetermineBandLevel(word),
                TopicName = string.IsNullOrWhiteSpace(topicName) ? DetermineTopicName(word, string.Empty, meaning) : topicName,
                BandConfidence = bandLevel > 0 ? 0.85 : CalculateBandConfidence(word),
                TopicConfidence = string.IsNullOrWhiteSpace(topicName) ? CalculateTopicConfidence(word, string.Empty, meaning) : 0.8
            };
        }
        catch (Exception ex)
        {
            // Fall back to local heuristics if Gemini fails
            Console.WriteLine($"Gemini request failed: {ex.Message}");
            return null;
        }
    }

    private static double CalculateBandConfidence(string word)
    {
        if (string.IsNullOrWhiteSpace(word)) return 0.0;
        var w = word.Trim().ToLower();

        // Strong signals: long words or academic suffixes -> high confidence
        var academicEndings = new[] { "ation", "ality", "ment", "ness", "ship", "able", "ible", "ical", "tive", "sociate", "tential" };
        if (w.Length >= 11 || academicEndings.Any(suffix => w.EndsWith(suffix)))
        {
            return 0.9;
        }

        // Medium signals: moderate length
        if (w.Length >= 7)
        {
            return 0.7;
        }

        // Short words -> lower confidence
        return 0.45;
    }

    private static double CalculateTopicConfidence(string word, string definition, string meaning)
    {
        var text = ($"{word} {definition} {meaning}").ToLower();
        if (string.IsNullOrWhiteSpace(text)) return 0.0;

        // Keyword sets for topics
        var topicMap = new Dictionary<string, string[]>
        {
            { "Technology", new[] { "computer", "software", "internet", "technology", "digital", "network", "device", "data", "science" } },
            { "Business", new[] { "business", "money", "market", "finance", "economic", "company", "industry", "trade", "cost" } },
            { "Education", new[] { "school", "education", "student", "university", "academic", "learn", "study", "knowledge" } },
            { "Environment", new[] { "environment", "nature", "animal", "plant", "earth", "climate", "forest", "wildlife" } },
            { "Health", new[] { "health", "medicine", "doctor", "disease", "body", "treatment", "medical", "patient" } },
            { "Arts & Media", new[] { "art", "music", "film", "book", "write", "media", "culture", "communication" } }
        };

        double bestScore = 0.0;
        foreach (var kv in topicMap)
        {
            var keywords = kv.Value;
            var matches = keywords.Count(k => text.Contains(k));
            if (matches == 0) continue;
            // score is fraction of matched keywords (capped) and weighted by keyword count
            var score = Math.Min(1.0, matches / Math.Max(1, keywords.Length) + 0.1);
            if (score > bestScore) bestScore = score;
        }

        // If no keyword match, but definition is long, give moderate confidence
        if (bestScore == 0 && (!string.IsNullOrWhiteSpace(definition) || !string.IsNullOrWhiteSpace(meaning)))
        {
            var len = (definition + " " + meaning).Length;
            if (len > 60) return 0.45;
            if (len > 20) return 0.3;
        }

        return Math.Round(bestScore, 2);
    }

    private static int DetermineBandLevel(string word)
    {
        word = word.ToLower().Trim();
        if (word.Length <= 4) return 5;
        if (word.Length <= 6) return 6;
        
        var academicEndings = new[] { "ation", "ality", "ment", "ness", "ship", "able", "ible", "ical", "tive", "sociate", "tential" };
        if (word.Length >= 9 || academicEndings.Any(suffix => word.EndsWith(suffix)))
        {
            return word.Length >= 11 ? 8 : 7;
        }
        
        return 6;
    }

    private static string DetermineTopicName(string word, string definition, string meaning)
    {
        var text = $"{word} {definition} {meaning}".ToLower();
        
        if (text.Contains("computer") || text.Contains("software") || text.Contains("internet") || 
            text.Contains("technology") || text.Contains("digital") || text.Contains("network") || 
            text.Contains("device") || text.Contains("data") || text.Contains("science"))
            return "Technology";
            
        if (text.Contains("business") || text.Contains("money") || text.Contains("market") || 
            text.Contains("finance") || text.Contains("economic") || text.Contains("company") || 
            text.Contains("industry") || text.Contains("trade") || text.Contains("cost"))
            return "Business";
            
        if (text.Contains("school") || text.Contains("education") || text.Contains("student") || 
            text.Contains("university") || text.Contains("academic") || text.Contains("learn") || 
            text.Contains("study") || text.Contains("knowledge"))
            return "Education";
            
        if (text.Contains("environment") || text.Contains("nature") || text.Contains("animal") || 
            text.Contains("plant") || text.Contains("earth") || text.Contains("climate") || 
            text.Contains("forest") || text.Contains("wildlife"))
            return "Environment";
            
        if (text.Contains("health") || text.Contains("medicine") || text.Contains("doctor") || 
            text.Contains("disease") || text.Contains("body") || text.Contains("treatment") || 
            text.Contains("medical") || text.Contains("patient"))
            return "Health";
            
        if (text.Contains("art") || text.Contains("music") || text.Contains("film") || 
            text.Contains("book") || text.Contains("write") || text.Contains("media") || 
            text.Contains("culture") || text.Contains("communication"))
            return "Arts & Media";
            
        return "General";
    }

    private static async Task<NlpAnalyzeResponse> AnalyzeWordAsync(
        HttpClient nlpClient,
        string text,
        CancellationToken cancellationToken)
    {
        try
        {
            var nlpResponse = await nlpClient.PostAsJsonAsync("/api/nlp/analyze", new { text }, cancellationToken);
            nlpResponse.EnsureSuccessStatusCode();

            return await nlpResponse.Content.ReadFromJsonAsync<NlpAnalyzeResponse>(cancellationToken: cancellationToken)
                ?? throw new InvalidOperationException("NLP service returned an empty response.");
        }
        catch (Exception exception)
        {
            throw new InvalidOperationException("NLP analysis is unavailable right now.", exception);
        }
    }

    private static async Task<string> TryTranslateAsync(
        HttpClient translationClient,
        string text,
        string sourceLanguage,
        string targetLanguage,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await translationClient.PostAsJsonAsync("/api/translation/translate", new
            {
                text,
                source_language = sourceLanguage,
                target_language = targetLanguage
            }, cancellationToken);
            response.EnsureSuccessStatusCode();

            var payload = await response.Content.ReadFromJsonAsync<TranslationResponse>(cancellationToken: cancellationToken)
                ?? throw new InvalidOperationException("Translation service returned an empty response.");

            return string.IsNullOrWhiteSpace(payload.TranslatedText) ? text : payload.TranslatedText;
        }
        catch
        {
            return text;
        }
    }

    private static string BuildMeaning(
        string sourceWord,
        IReadOnlyCollection<string> vietnameseMeanings,
        string translatedWord,
        string englishDefinition,
        string translatedDefinition)
    {
        return BuildMeaningCandidates(sourceWord, vietnameseMeanings, translatedWord, englishDefinition, translatedDefinition)
            .FirstOrDefault() ?? string.Empty;
    }

    private static IReadOnlyList<string> BuildMeaningCandidates(
        string sourceWord,
        IReadOnlyCollection<string> vietnameseMeanings,
        string translatedWord,
        string englishDefinition,
        string translatedDefinition)
    {
        var candidates = new List<string>();
        candidates.AddRange(vietnameseMeanings);

        if (IsCompactMeaning(translatedWord) && IsUsableMeaning(translatedWord, sourceWord))
        {
            candidates.AddRange(SplitMeaningCandidates(translatedWord));
        }

        if (!string.IsNullOrWhiteSpace(translatedDefinition) && IsUsableMeaning(translatedDefinition, englishDefinition))
        {
            candidates.AddRange(SplitMeaningCandidates(translatedDefinition));
        }

        return UniqueInOrder(candidates).Take(5).ToList();
    }

    private static bool IsUsableMeaning(string candidate, string sourceValue)
    {
        if (string.IsNullOrWhiteSpace(candidate))
        {
            return false;
        }

        return !string.Equals(candidate.Trim(), sourceValue.Trim(), StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsCompactMeaning(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var trimmed = value.Trim();
        if (trimmed.Length > 80)
        {
            return false;
        }

        var wordCount = trimmed.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
        return wordCount <= 6;
    }

    private static IEnumerable<string> SplitMeaningCandidates(string value)
    {
        return value
            .Split([",", ";", "/", "\n"], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(part => part.Trim());
    }

    private static IReadOnlyList<string> UniqueInOrder(IEnumerable<string> values)
    {
        var results = new List<string>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var value in values)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                continue;
            }

            var normalized = value.Replace('_', ' ').Trim();
            if (!seen.Add(normalized))
            {
                continue;
            }

            results.Add(normalized);
        }

        return results;
    }

    private sealed class NlpSynonym
    {
        public string Word { get; init; } = string.Empty;
        [JsonPropertyName("part_of_speech")]
        public string PartOfSpeech { get; init; } = string.Empty;
    }
    private sealed class NlpAnalyzeResponse
    {
        public string Word { get; init; } = string.Empty;
        [JsonPropertyName("part_of_speech")]
        public string PartOfSpeech { get; init; } = string.Empty;
        public string Lemma { get; init; } = string.Empty;
        [JsonPropertyName("ipa")]
        public string Ipa { get; init; } = string.Empty;
        [JsonPropertyName("english_definition")]
        public string EnglishDefinition { get; init; } = string.Empty;
        [JsonPropertyName("vietnamese_meanings")]
        public List<string> VietnameseMeanings { get; init; } = new();
        [JsonPropertyName("related_forms")]
        public List<NlpRelatedForm> RelatedForms { get; init; } = new();
        [JsonPropertyName("synonyms")]
        public List<NlpSynonym> Synonyms { get; init; } = new();
        public List<NlpExample> Examples { get; init; } = new();
    }

    private sealed class NlpRelatedForm
    {
        public string Word { get; init; } = string.Empty;
        [JsonPropertyName("part_of_speech")]
        public string PartOfSpeech { get; init; } = string.Empty;
    }

    private sealed class NlpExample
    {
        [JsonPropertyName("english_text")]
        public string EnglishText { get; init; } = string.Empty;
    }

    private sealed class TranslationResponse
    {
        [JsonPropertyName("translated_text")]
        public string TranslatedText { get; init; } = string.Empty;
    }
}
