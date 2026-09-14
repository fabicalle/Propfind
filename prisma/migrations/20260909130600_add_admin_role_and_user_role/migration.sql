-- AlterEnum: add 'ADMIN' value to user_role
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum WHERE enumlabel = 'ADMIN' AND enumtypid = 'user_role'::regtype::oid
    ) THEN
        ALTER TYPE user_role ADD VALUE 'ADMIN';
    END IF;
END $$;

-- AlterTable: add role column to users
ALTER TABLE "users" ADD COLUMN "role" user_role DEFAULT 'FINDER';
