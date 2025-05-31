ALTER TABLE "appointments" ADD COLUMN "appointment_date_time" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "appointment_price_in_cents" integer NOT NULL;