print("⚙️  Initializing Replica Set (initdb.d script) ...");

rs.initiate({
  _id: "rs0",
  members: [{ _id: 0, host: "mongo:27017" }]
});

print("✅ Replica Set Initialized");