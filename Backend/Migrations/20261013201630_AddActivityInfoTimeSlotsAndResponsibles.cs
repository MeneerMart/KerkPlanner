using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KerkPlanner.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddActivityInfoTimeSlotsAndResponsibles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkDays_Users_CloserId",
                table: "WorkDays");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkDays_Users_CoordinatorId",
                table: "WorkDays");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkDays_Users_OpenerId",
                table: "WorkDays");

            migrationBuilder.DropIndex(
                name: "IX_WorkDays_CloserId",
                table: "WorkDays");

            migrationBuilder.DropIndex(
                name: "IX_WorkDays_CoordinatorId",
                table: "WorkDays");

            migrationBuilder.DropIndex(
                name: "IX_WorkDays_OpenerId",
                table: "WorkDays");

            migrationBuilder.DropColumn(
                name: "CloserId",
                table: "WorkDays");

            migrationBuilder.DropColumn(
                name: "CoordinatorId",
                table: "WorkDays");

            migrationBuilder.DropColumn(
                name: "OpenerId",
                table: "WorkDays");

            migrationBuilder.AddColumn<string>(
                name: "CloserName",
                table: "WorkDays",
                type: "TEXT",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CoordinatorName",
                table: "WorkDays",
                type: "TEXT",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OpenerName",
                table: "WorkDays",
                type: "TEXT",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TimeSlot",
                table: "Enrollments",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "FullDay");

            migrationBuilder.AddColumn<int>(
                name: "EstimatedDurationMinutes",
                table: "Activities",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SafetyInstructions",
                table: "Activities",
                type: "TEXT",
                maxLength: 500,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CloserName",
                table: "WorkDays");

            migrationBuilder.DropColumn(
                name: "CoordinatorName",
                table: "WorkDays");

            migrationBuilder.DropColumn(
                name: "OpenerName",
                table: "WorkDays");

            migrationBuilder.DropColumn(
                name: "TimeSlot",
                table: "Enrollments");

            migrationBuilder.DropColumn(
                name: "EstimatedDurationMinutes",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "SafetyInstructions",
                table: "Activities");

            migrationBuilder.AddColumn<Guid>(
                name: "CloserId",
                table: "WorkDays",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CoordinatorId",
                table: "WorkDays",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "OpenerId",
                table: "WorkDays",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkDays_CloserId",
                table: "WorkDays",
                column: "CloserId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkDays_CoordinatorId",
                table: "WorkDays",
                column: "CoordinatorId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkDays_OpenerId",
                table: "WorkDays",
                column: "OpenerId");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkDays_Users_CloserId",
                table: "WorkDays",
                column: "CloserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkDays_Users_CoordinatorId",
                table: "WorkDays",
                column: "CoordinatorId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkDays_Users_OpenerId",
                table: "WorkDays",
                column: "OpenerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
