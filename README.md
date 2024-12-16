### Setup for dev
1. should have docker and and docker-compose installed
2. To install dependencies
   `npm install` || {do not use yarn here}
3. To start Mongo server on docker
   `docker-compose -f docker-compose.db.yml up`
4. To start Mongo server
   `docker-compose -f docker-compose.db.yml down`
5. To start server
   `yarn dev` | `npm run dev`
6. To stop the server
   `ctrl + c`
7. To seed data
   `npx ts-node seed/start.ts`


### Deplay using pm2
1. To build (convert to js files)
   `npm run build`
2. To deploy using pm2
   `pm2 start dist/server.js`
