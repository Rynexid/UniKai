CREATE SCHEMA "dms";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dms"."dm_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"sender_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dms"."dm_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_a" text NOT NULL,
	"user_b" text NOT NULL,
	"last_message_at" timestamp with time zone,
	"last_read_a_at" timestamp with time zone,
	"last_read_b_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dms"."dm_messages" ADD CONSTRAINT "dm_messages_room_id_dm_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "dms"."dm_rooms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dms"."dm_messages" ADD CONSTRAINT "dm_messages_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dms"."dm_rooms" ADD CONSTRAINT "dm_rooms_user_a_user_id_fk" FOREIGN KEY ("user_a") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dms"."dm_rooms" ADD CONSTRAINT "dm_rooms_user_b_user_id_fk" FOREIGN KEY ("user_b") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dm_messages_room_id_idx" ON "dms"."dm_messages" USING btree ("room_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dm_messages_sender_id_idx" ON "dms"."dm_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "dm_rooms_pair_idx" ON "dms"."dm_rooms" USING btree ("user_a","user_b");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dm_rooms_user_a_idx" ON "dms"."dm_rooms" USING btree ("user_a");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dm_rooms_user_b_idx" ON "dms"."dm_rooms" USING btree ("user_b");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dm_rooms_last_message_at_idx" ON "dms"."dm_rooms" USING btree ("last_message_at");