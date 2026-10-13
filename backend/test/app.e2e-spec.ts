import {INestApplication} from '@nestjs/common';
import {Test, TestingModule} from '@nestjs/testing';
import request from 'supertest';
import {App} from 'supertest/types';
import {configureApp} from './../src/setup.js';

// Seeded users: 1 = Admin, 2 = Anna, 3 = Ben
const ADMIN = {'X-User-Id': '1'};
const ANNA = {'X-User-Id': '2'};

describe('Music Collection Manager API (e2e)', () => {
  let app: INestApplication<App>;
  let api: () => ReturnType<typeof request>;

  beforeEach(async () => {
    process.env.DB_PATH = ':memory:';
    // Imported after setting DB_PATH, because the module reads it at load time.
    const {AppModule} = await import('./../src/app.module.js');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    api = () => request(app.getHttpServer());
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects requests without X-User-Id', () => {
    return api().get('/api/v1/music-items').expect(401);
  });

  it('lists users without X-User-Id (public endpoint)', async () => {
    const res = await api().get('/api/v1/users').expect(200);
    expect(res.body).toHaveLength(3);
  });

  it('lists the catalogue with pagination and filters', async () => {
    const res = await api()
      .get('/api/v1/music-items?type=ALBUM')
      .set(ANNA)
      .expect(200);
    expect(res.body.meta).toEqual({page: 1, limit: 20, total: 1});
    expect(res.body.data[0]).toMatchObject({
      title: 'Abbey Road',
      trackCount: 3,
      durationSeconds: 626,
      averageRating: 4.5,
    });
  });

  it('only lets admins change the catalogue', async () => {
    const track = {type: 'TRACK', title: 'Yesterday', durationSeconds: 125};
    await api().post('/api/v1/music-items').set(ANNA).send(track).expect(403);
    await api().post('/api/v1/music-items').set(ADMIN).send(track).expect(201);
  });

  it('validates track lists of playlists', async () => {
    const res = await api()
      .post('/api/v1/music-items')
      .set(ADMIN)
      .send({type: 'PLAYLIST', title: 'Mix', trackIds: [1, 6]})
      .expect(400);
    expect(res.body.message).toBe('These ids are not existing tracks: 6');
  });

  it('manages the own collection and rejects DISLIKE + favourite', async () => {
    await api()
      .post('/api/v1/users/2/collection')
      .set(ANNA)
      .send({musicItemId: 5})
      .expect(201);
    await api()
      .post('/api/v1/users/2/collection')
      .set(ANNA)
      .send({musicItemId: 5})
      .expect(409);
    await api()
      .post('/api/v1/users/3/collection')
      .set(ANNA)
      .send({musicItemId: 5})
      .expect(403);

    await api()
      .patch('/api/v1/users/2/collection/5')
      .set(ANNA)
      .send({reaction: 'DISLIKE', favourite: true})
      .expect(400);
    const res = await api()
      .patch('/api/v1/users/2/collection/5')
      .set(ANNA)
      .send({reaction: 'LIKE', favourite: true})
      .expect(200);
    expect(res.body).toMatchObject({reaction: 'LIKE', favourite: true});

    await api().delete('/api/v1/users/2/collection/5').set(ANNA).expect(204);
  });

  it('creates a rating once and replaces it afterwards', async () => {
    await api()
      .put('/api/v1/music-items/1/ratings/2')
      .set(ANNA)
      .send({stars: 3})
      .expect(201);
    await api()
      .put('/api/v1/music-items/1/ratings/2')
      .set(ANNA)
      .send({stars: 5})
      .expect(200);
    const res = await api()
      .get('/api/v1/music-items/1/ratings')
      .set(ANNA)
      .expect(200);
    expect(res.body).toMatchObject({average: 5, count: 1});
  });

  it('removes a deleted item from all collections', async () => {
    await api().delete('/api/v1/music-items/6').set(ADMIN).expect(204);
    const res = await api()
      .get('/api/v1/users/2/collection')
      .set(ANNA)
      .expect(200);
    expect(res.body.data.map((e: any) => e.musicItem.id)).not.toContain(6);
  });
});
