# echo 'Checking MySQL...';

# until mysql -h"$MYSQL_DB_HOST" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SHOW DATABASES;" > /dev/null 2>&1; do
#   echo "MySQL is unavailable - sleeping"
#   sleep 1
# done

# echo 'MySQL is up...';

# # Optional: Add error handling
# if [ $? -ne 0 ]; then
#   echo "Error: Unable to connect to MySQL."
#   exit 1
# fi

# Execute your commands
npm run prisma:generate && npm run prisma:migrate && npm run start:dev;