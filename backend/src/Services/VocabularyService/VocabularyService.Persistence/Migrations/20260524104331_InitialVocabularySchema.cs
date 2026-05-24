using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace VocabularyService.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialVocabularySchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "bands",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(400)", maxLength: 400, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bands", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "topics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(400)", maxLength: 400, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ColorHex = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_topics", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "vocabularies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Word = table.Column<string>(type: "varchar(120)", maxLength: 120, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Meaning = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PartOfSpeech = table.Column<string>(type: "varchar(120)", maxLength: 120, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Pronunciation = table.Column<string>(type: "varchar(120)", maxLength: 120, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BandId = table.Column<int>(type: "int", nullable: false),
                    TopicId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vocabularies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_vocabularies_bands_BandId",
                        column: x => x.BandId,
                        principalTable: "bands",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_vocabularies_topics_TopicId",
                        column: x => x.TopicId,
                        principalTable: "topics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "examples",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    VocabularyId = table.Column<int>(type: "int", nullable: false),
                    EnglishText = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    VietnameseMeaning = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_examples", x => x.Id);
                    table.ForeignKey(
                        name: "FK_examples_vocabularies_VocabularyId",
                        column: x => x.VocabularyId,
                        principalTable: "vocabularies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.InsertData(
                table: "bands",
                columns: new[] { "Id", "Description", "Name", "SortOrder" },
                values: new object[,]
                {
                    { 1, "Core words for early intermediate learners", "IELTS 5.0", 1 },
                    { 2, "Words for developing academic fluency", "IELTS 6.0", 2 },
                    { 3, "Advanced academic vocabulary", "IELTS 7.0", 3 }
                });

            migrationBuilder.InsertData(
                table: "topics",
                columns: new[] { "Id", "ColorHex", "Description", "Name" },
                values: new object[,]
                {
                    { 1, "#C51E3A", "Academic and school-related vocabulary", "Education" },
                    { 2, "#8B0000", "Ecology, climate, and sustainability terms", "Environment" },
                    { 3, "#E54B4B", "Travel, tourism, and culture vocabulary", "Travel" }
                });

            migrationBuilder.InsertData(
                table: "vocabularies",
                columns: new[] { "Id", "BandId", "CreatedAt", "Meaning", "PartOfSpeech", "Pronunciation", "TopicId", "UpdatedAt", "Word" },
                values: new object[,]
                {
                    { 1, 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "chuong trinh hoc", "noun", "/kəˈrɪk.jə.ləm/", 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "curriculum" },
                    { 2, 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "da dang sinh hoc", "noun", "/ˌbaɪ.əʊ.daɪˈvɜː.sə.ti/", 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "biodiversity" }
                });

            migrationBuilder.InsertData(
                table: "examples",
                columns: new[] { "Id", "DisplayOrder", "EnglishText", "VietnameseMeaning", "VocabularyId" },
                values: new object[,]
                {
                    { 1, 1, "The national curriculum was updated to include more digital skills.", "Chuong trinh hoc quoc gia da duoc cap nhat de bo sung ky nang so.", 1 },
                    { 2, 1, "Protecting biodiversity is essential for maintaining ecosystem stability.", "Bao ve da dang sinh hoc la dieu thiet yeu de duy tri su on dinh cua he sinh thai.", 2 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_bands_Name",
                table: "bands",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_examples_VocabularyId",
                table: "examples",
                column: "VocabularyId");

            migrationBuilder.CreateIndex(
                name: "IX_topics_Name",
                table: "topics",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_vocabularies_BandId",
                table: "vocabularies",
                column: "BandId");

            migrationBuilder.CreateIndex(
                name: "IX_vocabularies_TopicId_Word",
                table: "vocabularies",
                columns: new[] { "TopicId", "Word" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "examples");

            migrationBuilder.DropTable(
                name: "vocabularies");

            migrationBuilder.DropTable(
                name: "bands");

            migrationBuilder.DropTable(
                name: "topics");
        }
    }
}
