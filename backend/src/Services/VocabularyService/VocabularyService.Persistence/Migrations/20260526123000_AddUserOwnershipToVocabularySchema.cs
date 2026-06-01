using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocabularyService.Persistence.Migrations
{
    public partial class AddUserOwnershipToVocabularySchema : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_bands_Name",
                table: "bands");

            migrationBuilder.DropIndex(
                name: "IX_topics_Name",
                table: "topics");

            migrationBuilder.DropIndex(
                name: "IX_vocabularies_TopicId_Word",
                table: "vocabularies");

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "bands",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "topics",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "vocabularies",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_bands_UserId_Name",
                table: "bands",
                columns: new[] { "UserId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_topics_UserId_Name",
                table: "topics",
                columns: new[] { "UserId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_vocabularies_UserId_TopicId_Word",
                table: "vocabularies",
                columns: new[] { "UserId", "TopicId", "Word" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_vocabularies_UserId_TopicId_Word",
                table: "vocabularies");

            migrationBuilder.DropIndex(
                name: "IX_topics_UserId_Name",
                table: "topics");

            migrationBuilder.DropIndex(
                name: "IX_bands_UserId_Name",
                table: "bands");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "vocabularies");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "topics");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "bands");

            migrationBuilder.CreateIndex(
                name: "IX_bands_Name",
                table: "bands",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_topics_Name",
                table: "topics",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_vocabularies_TopicId_Word",
                table: "vocabularies",
                columns: new[] { "TopicId", "Word" },
                unique: true);
        }
    }
}
