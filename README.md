# MERN

## Setup

Clone this repo and navigate to the project directory. Then,


Install server dependencies:

```
npm install
```

Install client dependencies:

```
cd client
npm install
cd ..
```

Configure your environment variables by editing the `.env` file in the root directory.

- Set `MONGO_URL` to your MongoDB connection string, e.g., if you have a local MongoDB instance running on the default port with the database set up as `mern`, set it to `mongodb://localhost:27017/mern`.
- Other parameters like the `JWT_SECRET` should be changed if desired, especially in production.


## Development

Test the server (starts both server and client, auto restarts on changes):
```
npm run dev
```


## Testing

Run frontend tests:
```
npm run test:frontend
```

Run backend tests:
```
npm run test:backend
```

Run both tests:
```
npm run test:frontend && npm run test:backend
```


## CI link

[ TO BE UPDATED ]
