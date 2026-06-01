using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace VocabularyService.API.Extensions;

internal static class ControllerExtensions
{
    public static bool TryGetUserId(this ControllerBase controller, out int userId)
    {
        userId = 0;
        var userIdClaim = controller.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? controller.User.FindFirst("sub")?.Value;

        return !string.IsNullOrWhiteSpace(userIdClaim) && int.TryParse(userIdClaim, out userId);
    }
}
