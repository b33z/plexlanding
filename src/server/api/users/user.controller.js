import User from './user.model';
import logger from '../../logger';

const log = logger.create('User:Ctrl');

export async function all(ctx) {
  const users = await new User().find();
  ctx.body = { users };
}

export async function create(ctx) {
  // TODO talk to plex api
  try {
    const user = new User(ctx.request.body);
    log.verbose(`Creating new user [${user.email}]`);
    await user.save();
    ctx.body = { user: user.values() };
  } catch (err) {
    ctx.throw(422, err);
  }
}

export async function getUser(ctx, next) {
  const user = await new User().findById(ctx.params.id);
  if (!user) {
    ctx.throw(404, `User ${ctx.params.id} could not be found`);
  }
  ctx.body = { user };

  if (next) {
    return next();
  }
}

export async function update(ctx) {
  const user = ctx.body.user;

  await user.save(ctx.request.body);

  ctx.body = { user: user.values() };
}

export async function destroy(ctx) {
  const user = ctx.body.user;
  log.info(`Deleting user with id of ${user._id}`);

  await user.destroy();

  ctx.status = 200;
  ctx.body = { success: true };
}

export default { all, create, getUser, update, destroy };
