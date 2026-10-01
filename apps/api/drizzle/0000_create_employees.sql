CREATE TABLE `employees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_code` text NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`job_title` text NOT NULL,
	`department` text NOT NULL,
	`country_code` text NOT NULL,
	`currency` text NOT NULL,
	`salary_minor` integer NOT NULL,
	`employment_type` text NOT NULL,
	`hire_date` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_employee_code_unique` ON `employees` (`employee_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `employees_email_unique` ON `employees` (`email`);--> statement-breakpoint
CREATE INDEX `employees_country_job_title_idx` ON `employees` (`country_code`,`job_title`);--> statement-breakpoint
CREATE INDEX `employees_country_salary_idx` ON `employees` (`country_code`,`salary_minor`);--> statement-breakpoint
CREATE INDEX `employees_department_idx` ON `employees` (`department`);--> statement-breakpoint
CREATE INDEX `employees_job_title_idx` ON `employees` (`job_title`);--> statement-breakpoint
CREATE INDEX `employees_full_name_idx` ON `employees` (`full_name`);