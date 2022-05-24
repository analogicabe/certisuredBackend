"use strict";
const { parseMultipartData, sanitizeEntity } = require("strapi-utils");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    const { user } = ctx.state;
    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.userprofile.search({
        ...ctx.query,
        user: user.id,
      });
    } else {
      entities = await strapi.services.userprofile.find({
        ...ctx.query,
        user: user.id,
      });
    }

    return entities.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models.userprofile })
    );
  },
  async findOne(ctx) {
    const { id } = ctx.params;
    const { user } = ctx.state;

    const entity = await strapi.services.userprofile.findOne({
      id,
      user: user.id,
    });
    return sanitizeEntity(entity, { model: strapi.models.userprofile });
  },

  async update(ctx) {
    const { id } = ctx.params;
    const { user } = ctx.state;

    const entity = await strapi.services.userprofile.update(
      {
        id,
        user: user.id,
      },
      ctx.request.body
    );
    return sanitizeEntity(entity, { model: strapi.models.userprofile });
  },

  async create(ctx) {
    const {
      topicDetails,
      course_id,
      userFirstName,
      userLastName,
      userPhoto,
      userInfo,
      user_skills,
      user_college_name,
      user_degree,
      userBackgroundPhoto,
      userNotes,
      userLastWatched,
      linkedin_url,
      resume_google_drive_url,
      company_name,
      company_year,
      company_desc,
    } = ctx.request.body;
    const { user } = ctx.state;

    const entry = {
      topicDetails,
      user: user,
      course_id: course_id,
      userFirstName,
      userLastName,
      userPhoto,
      userInfo,
      user_skills,
      user_college_name,
      user_degree,
      userBackgroundPhoto,
      userNotes,
      userLastWatched,
      linkedin_url,
      resume_google_drive_url,
      company_name,
      company_year,
      company_desc,
    };
    const entity = await strapi.services.userprofile.create(entry);
    return sanitizeEntity(entity, { model: strapi.models.userprofile });
  },
};
