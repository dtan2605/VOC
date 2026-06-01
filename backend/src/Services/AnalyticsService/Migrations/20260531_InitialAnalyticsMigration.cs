using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnalyticsService.API.Migrations
{
    public partial class InitialAnalyticsMigration : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "study_events",
                columns: table => new
                {
                    id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    user_id = table.Column<string>(type: "TEXT", nullable: false),
                    word_id = table.Column<int>(type: "INTEGER", nullable: false),
                    action = table.Column<string>(type: "TEXT", nullable: false),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_study_events", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "daily_user_metrics",
                columns: table => new
                {
                    id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    user_id = table.Column<string>(type: "TEXT", nullable: false),
                    metric_date = table.Column<DateTime>(type: "TEXT", nullable: false),
                    study_sessions = table.Column<int>(type: "INTEGER", nullable: false),
                    reviewed_count = table.Column<int>(type: "INTEGER", nullable: false),
                    avg_mastery = table.Column<decimal>(type: "TEXT", nullable: true),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_daily_user_metrics", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "UX_User_Date",
                table: "daily_user_metrics",
                columns: new[] { "user_id", "metric_date" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "daily_user_metrics");
            migrationBuilder.DropTable(name: "study_events");
        }
    }
}
