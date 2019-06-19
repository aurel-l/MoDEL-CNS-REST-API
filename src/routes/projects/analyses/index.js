const Router = require('express').Router;

const handler = require('../../../utils/generic-handler');

const { NOT_FOUND } = require('../../../utils/status-codes');
const publishedFilter = require('../../../utils/published-filter');
const augmentFilterWithIDOrAccession = require('../../../utils/augment-filter-with-id-or-accession');

const analysisRouter = Router();

module.exports = (_, { projects, analyses }) => {
  // root
  const rootRetriever = (_, { project }) =>
    projects.findOne(
      // filter
      augmentFilterWithIDOrAccession(publishedFilter, project),
      // options
      { projection: { _id: false, analyses: true } },
    );

  const rootSerializer = (response, data) => {
    if (!(data && data.analyses)) {
      return response.sendStatus(NOT_FOUND);
    }
    response.json(data.analyses);
  };

  // analysis
  const analysisRetriever = async (request, { project }) => {
    const projectDoc = await projects.findOne(
      // filter
      augmentFilterWithIDOrAccession(publishedFilter, project),
      // options
      { projection: { _id: true } },
    );
    if (!projectDoc) return;
    return analyses.findOne(
      // filter
      { project: projectDoc._id, name: request.params.analysis.toLowerCase() },
      // options
      { projection: { _id: false, project: false } },
    );
  };

  const analysisSerializer = (response, data) => {
    if (!(data && data.value)) {
      return response.sendStatus(NOT_FOUND);
    }
    const { value, ..._data } = data;
    response.json({ ..._data, ...value });
  };

  // handlers
  analysisRouter.route('/').get(handler(rootRetriever, rootSerializer));

  analysisRouter
    .route('/:analysis')
    .get(handler(analysisRetriever, analysisSerializer));

  return analysisRouter;
};
