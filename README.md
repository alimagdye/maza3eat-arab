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

4. Create the database
``` bash
    CREATE DATABASE maza3eat_db;
```

5. Connect to your database url:
``` bash
    npx prisma generate
```

6. Add database migrations:
``` bash
    npx prisma migrate dev
```

7. Start the server for development:
``` bash
    npm run dev
```

8. View the databse data (optional):
``` bash
    npx prisma studio
```

## Backend Testing & API Documentation
- [postman link](https://www.postman.com/alimagdye1-7412892/workspace/maza3eat)