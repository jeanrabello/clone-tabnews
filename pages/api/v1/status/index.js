import database from "infra/database";

async function status(request, response) {
  const updatedAt = new Date().toISOString();

  const databaseVersion = (await database.query("SHOW server_version;")).rows[0]
    .server_version;

  const databaseMaxConnections = (await database.query("SHOW max_connections;"))
    .rows[0].max_connections;

  const databaseName = process.env.POSTGRES_DB;
  const databaseUsedConnections = (
    await database.query({
      text: "SELECT COUNT(*)::int FROM pg_stat_activity WHERE datname = $1;",
      values: [databaseName],
    })
  ).rows[0].count;

  response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: databaseVersion,
        max_connections: parseInt(databaseMaxConnections),
        opened_connections: databaseUsedConnections,
      },
    },
  });
}

export default status;
