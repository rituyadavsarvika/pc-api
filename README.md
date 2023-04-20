[![Quality Gate Status][![Bugs][![Code Smells][![Vulnerabilities][![Technical Debt](http://122.176.92.25:9000/api/project_badges/measure?project=pc-api&metric=alert_status&token=sqb_c20db2ab9ed88c75db32be8a70a9aa2e183687fd)](http://122.176.92.25:9000/dashboard?id=pc-api)
# Step by step procedure to setup prolificcloud.com backend in **Production/Staging**

## Dependency for this project

    -   NodeJs. Version should 12.xx or upper
    -   npm. In some case npm will install automatically with nodeJs
    -   MongoDB. Minimum 4.xx or Latest
    -   Backup & restore mongoDB

-   Clone the project. Project location can be anywhere in your system. It's not mandatory to clone under /var/www.
-   Before running this project you have to create a **.env** file under project root directory. You can just copy **example.env** file and renamed it.

## Then add the following variables in the .env file:

    -   HOST=localhost
    -   PORT=3530 your project backend will run on this port
    -   NODE_ENV=development/production
    -   API_URL=https://api.you_domain.com. protocol is up to you. if you add ssl then https otherwise http. we will add virtual host for this URL later. Obviously without www
    -   SITE_URL=https://your_doamin. protocol & virtual host will create later. Obviously without www
    -   DB_USER=your_system_database_user. You have to create & set role accordingly.
    -   DB_PASSWORD=Database password for DB_USER
    -   DATABASE_URL=mongodb://{DB_USER}:{DB_PASSWORD}@{HOST}:{mongodb_port}/{Database_name}?authSource={Database_name_where_the_user_is_created}
    -   JWT_SECRET_KEY=Any string you can put here. special character is allowed here. Length should be at least 32 character.
    -   JWT_EXPIRES_IN=10d/30d or anything you want. This period refers auth token validation duration. After this period token will expire
    -   BCRYPT_SALT=Token encryption parameter. For bigger no encryption will be more secure. But for bigger no it will be more CPU intensive. so 10 is perfect for now.
    -   STRIPE_PUBLIC_KEY=Stripe_publishable_key
    -   STRIPE_SECRET_KEY=Stripe_secret_Key
    -   MAIN_SITE=your_domain without any protocol & www. That's the difference between MAIN_SITE & SITE_URL
    -   MEDIA_ROOT=set_any_writable_directory, Where all media content will store.
    -   MEDIA_LIMIT=Max_allowed_media_size_in_MB. You can't upload any media bigger that this limit. This limit is in MB.
    -   SUPERADMIN_CODE=put_any_8digit_code. This SUPERADMIN_CODE refers unique code for superadmin (prolificcloud.com)
    -   STRIPEENDPOINTSECRET=Secret_code_for_stripe_API_endpoint_webhook
    -   NGINX_CONFIG_URL=Any_writable_directory, where nginx config will for custom domain will store.
    -   PROTOCOL=http
    -   FREE_TRAIL_HOSTING_SPACE=4, space in GB


-   Type `npm install` to install all dependencies. try `npm audit fix` if needed.
-   To make sure this project is running always. to do that we have to install pm2. Run `sudo npm install pm2@latest -g`
-   Run project using pm2 using this command `npm run server:dev` for dev-staging & `npm run server:prod` for production. instance_name can be any human readable name. so that you can distinguish different instance
-   For server update we have to restart pm2 using the command `pm2 restart instance_name`
-   We need to create 2 virtual hosts
    -   Virtual host for `media`
    -   Virtual host for `api.your_domain.com`
