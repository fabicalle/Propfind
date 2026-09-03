-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "property_id" TEXT NOT NULL,
    "property_title" TEXT NOT NULL,
    "sender_name" TEXT NOT NULL,
    "sender_email" TEXT NOT NULL,
    "sender_phone" TEXT,
    "message" TEXT NOT NULL,
    "recipient_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_messages_recipientId_created_at_idx" ON "contact_messages"("recipient_id", "created_at");

-- CreateIndex
CREATE INDEX "contact_messages_propertyId_idx" ON "contact_messages"("property_id");
