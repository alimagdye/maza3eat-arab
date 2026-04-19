# maza3eat-arab
Maza3eat Arab website

## Backend Setup & Installation
1. Enter backend directory:
``` bash
cd backend
```

2. Install packages:
``` bash
npm i
```

3. Add environment variables based on `.env.example`.

4. Create the database. *(skip this step if you run it via server)*
``` bash
CREATE DATABASE maza3eat_db;
```

5. Setup and seed your database:
``` bash
npm run db:setup
```

6. Start the server for development:
``` bash
npm run dev
```

7. View the databse data (optional):
``` bash
npx prisma studio
```

## Backend Testing & API Documentation
- [postman link](https://www.postman.com/alimagdye1-7412892/workspace/maza3eat)