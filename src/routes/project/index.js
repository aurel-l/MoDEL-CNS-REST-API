const Router = require('express').Router;

const dbConnection = require('../../models/index');
const storeParameterMiddleware = require('../../utils/store-parameter-middleware');

const NO_CONTENT = 204;
const NOT_FOUND = 404;

const projectRouter = Router();

(async () => {
  let mongoConfig;
  try {
    // mongo config file, can be json or js code
    mongoConfig = require('../../../configs/mongo');
  } catch (_) {
    console.error("couldn't find mongo config file");
    return;
  }
  const client = await dbConnection;
  const db = client.db(mongoConfig.db);
  const model = db.collection('projects');

  projectRouter.route('/').get(async (request, response) => {
    const cursor = model.find();
    const [projects, count] = await Promise.all([
      cursor
        // pagination
        .skip(request.skip)
        .limit(request.query.limit)
        // transform document for public output
        .map(({ _id: identifier, ...rest }) => ({ identifier, ...rest }))
        .toArray(),
      cursor.count(),
    ]);
    if (!count) response.status(NO_CONTENT);
    response.json({ projects, count });
  });

  projectRouter.route('/:project').get(async (request, response) => {
    const project = await model.findOne({ _id: request.params.project });
    if (!project) return response.sendStatus(NOT_FOUND);
    const { _id: identifier, ...rest } = project;
    response.json({ identifier, ...rest });
  });

  // pass on to other handlers
  const storeProjectMiddleware = storeParameterMiddleware('project');

  projectRouter.use(
    '/:project/file',
    storeProjectMiddleware,
    require('./file')(db, model),
  );

  projectRouter.use(
    '/:project/analysis',
    storeProjectMiddleware,
    require('./analysis')(db, model),
  );
})();

module.exports = projectRouter;
