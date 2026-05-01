const mongoose = require('mongoose');
const mongoURI = "mongodb://sarthakn02317:Reo0csrbFcsidRxO@ac-8wsxmib-shard-00-00.gdk7rsa.mongodb.net:27017,ac-8wsxmib-shard-00-01.gdk7rsa.mongodb.net:27017,ac-8wsxmib-shard-00-02.gdk7rsa.mongodb.net:27017/taskmanager?ssl=true&replicaSet=atlas-ukn1uy-shard-0&authSource=admin&appName=Cluster0";

async function main() {
  await mongoose.connect(mongoURI);
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  console.log('Total users in DB:', users.length);
  console.log('Users detail:', users.map(u => ({ id: u._id.toString(), name: u.name, role: u.role })));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
