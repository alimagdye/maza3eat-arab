# maza3eat-arab
Maza3eat Arab website

## Backend Setup & Installation

1. Install packages:
``` bash
npm i
```

2. Add environment variables based on `.env.example`.

3. Create the database. *(skip this step if you run it via server)*
``` bash
CREATE DATABASE maza3eat_db;
```

4. Setup and seed your database:
``` bash
npm run db:setup
```

5. Start the server for development:
``` bash
npm run dev
```

6. View the databse data (optional):
``` bash
npx prisma studio
```

## Backend Testing & API Documentation
- [postman link](https://www.postman.com/alimagdye1-7412892/workspace/maza3eat)