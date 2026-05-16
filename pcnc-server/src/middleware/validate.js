/**
 * Zod-based request validator.
 *
 *   router.post('/things', validate({ body: createThingSchema }), handler);
 *
 * Parsed (and transformed) data is written back onto req for the handler:
 *   req.validatedBody, req.validatedQuery, req.validatedParams
 */
export const validate = (schemas) => (req, _res, next) => {
  try {
    if (schemas.body)   req.validatedBody   = schemas.body.parse(req.body);
    if (schemas.query)  req.validatedQuery  = schemas.query.parse(req.query);
    if (schemas.params) req.validatedParams = schemas.params.parse(req.params);
    next();
  } catch (err) {
    next(err);
  }
};
