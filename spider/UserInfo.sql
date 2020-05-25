create table UserInfo (
     id_user serial UNIQUE,
     name varchar(20) DEFAULT NULL,
     passwd vachar(20) DEFAULT NULL
)


create table Logs(
     id_log serial UNIQUE,
     username varchar(20) DEFAULT NULL,
     log_time date DEFAULT CURRENT_TIMESTAMP,
     operation varchar(100) DEFAULT NULL
)