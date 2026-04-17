-- Create sessions table for express-session with connect-pg-simple
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  PRIMARY KEY ("sid")
) WITH (OIDS=FALSE);

-- Create index on expire column for cleanup
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
