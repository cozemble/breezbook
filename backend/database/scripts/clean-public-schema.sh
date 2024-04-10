psql  -c "DO \$\$ DECLARE
              r RECORD;
          BEGIN
              -- Delete all tables in the public schema
              FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                  EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE;';
              END LOOP;
          END \$\$;"

psql -c "DO \$\$ DECLARE
             r RECORD;
         BEGIN
             -- Delete all functions in the public schema
             FOR r IN (SELECT proname, oidvectortypes(proargtypes) AS args
                       FROM pg_proc
                       WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) LOOP
                 EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || '(' || r.args || ') CASCADE;';
             END LOOP;
         END \$\$;"

psql -c "DO \$\$ DECLARE
             r RECORD;
         BEGIN
             -- Delete all enums in the public schema
             FOR r IN (SELECT typname FROM pg_type WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) LOOP
                 EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE;';
             END LOOP;
         END \$\$;"