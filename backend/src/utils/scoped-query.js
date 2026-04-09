function scopedQuery(model, req) {
  return model.findAll({
    where: {
      tenant_id: req.tenant.id
    }
  });
}

module.exports = scopedQuery;
