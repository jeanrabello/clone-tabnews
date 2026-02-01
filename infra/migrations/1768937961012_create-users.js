exports.up = (pgm) => {
  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    // For reference, github limits usernames to 39 characters.
    username: {
      type: "varchar(30)",
      notNull: true,
      unique: true,
    },
    // Why 254 in length? https://stackoverflow.com/a/1199238
    email: {
      type: "varchar(254)",
      notNull: true,
      unique: true,
    },
    // Why 72 in length? https://security.stackexchange.com/a/39849
    password: {
      type: "varchar(72)",
      notNull: true,
    },
    // Why timestamp with time zone? https://justatheory.com/2012/04/postgres-use-timestamptz
    created_at: {
      type: "timestamptz",
      default: pgm.func("now()"),
      notNull: true,
    },
    // Why timestamp with time zone? https://justatheory.com/2012/04/postgres-use-timestamptz
    updated_at: {
      type: "timestamptz",
      default: pgm.func("now()"),
      notNull: true,
    },
  });
};

exports.down = false;
