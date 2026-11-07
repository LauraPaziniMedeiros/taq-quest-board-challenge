CREATE TABLE "quest_tag" (
	"quest_internal_id" integer NOT NULL,
	"tag_internal_id" integer NOT NULL,
	CONSTRAINT "quest_tag_pkey" PRIMARY KEY("quest_internal_id","tag_internal_id")
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"external_id" text NOT NULL CONSTRAINT "tag_external_id_unique" UNIQUE,
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tag_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"normalized_name" varchar NOT NULL CONSTRAINT "tag_normalized_name_unique" UNIQUE,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "quest_tag_tag_internal_id_index" ON "quest_tag" ("tag_internal_id");--> statement-breakpoint
ALTER TABLE "quest_tag" ADD CONSTRAINT "quest_tag_quest_internal_id_quest_id_fkey" FOREIGN KEY ("quest_internal_id") REFERENCES "quest"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quest_tag" ADD CONSTRAINT "quest_tag_tag_internal_id_tag_id_fkey" FOREIGN KEY ("tag_internal_id") REFERENCES "tag"("id") ON DELETE CASCADE;