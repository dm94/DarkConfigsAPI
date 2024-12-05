export const addDownloads = async (server, request) => {
  try {
    if (!request.params.configid) {
      return;
    }

    const configId = request.params.configid;
    if (!configId || configId == null) {
      return;
    }

    const configCollection = server.mongo.client.db("dark").collection("configs");
    const idConfig = new server.mongo.ObjectId(configId);

    let downloads = 0;
    const configInfo = await configCollection.findOne(
      { _id: idConfig },
      { projection: { downloads: 1 } },
    );
    if (configInfo) {
      downloads = configInfo.downloads;
      await configCollection.updateOne(
        { _id: idConfig },
        {
          $set: {
            downloads: downloads + 1,
          },
        },
        { upsert: true },
      );
    }
  } catch (error) {
    console.log(error);
  }
};
