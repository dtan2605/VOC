using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearningService.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddReviewDirectionAndValidation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Direction",
                table: "review_history",
                type: "varchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ExpectedAnswer",
                table: "review_history",
                type: "varchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<bool>(
                name: "IsCorrect",
                table: "review_history",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "UserAnswer",
                table: "review_history",
                type: "varchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "BestStreak",
                table: "learning_sessions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CurrentStreak",
                table: "learning_sessions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Direction",
                table: "learning_sessions",
                type: "varchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Direction",
                table: "review_history");

            migrationBuilder.DropColumn(
                name: "ExpectedAnswer",
                table: "review_history");

            migrationBuilder.DropColumn(
                name: "IsCorrect",
                table: "review_history");

            migrationBuilder.DropColumn(
                name: "UserAnswer",
                table: "review_history");

            migrationBuilder.DropColumn(
                name: "BestStreak",
                table: "learning_sessions");

            migrationBuilder.DropColumn(
                name: "CurrentStreak",
                table: "learning_sessions");

            migrationBuilder.DropColumn(
                name: "Direction",
                table: "learning_sessions");
        }
    }
}
