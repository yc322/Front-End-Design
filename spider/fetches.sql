CREATE TABLE fetches (
   id_fetches serial UNIQUE,
   url text DEFAULT NULL UNIQUE,
   source_name varchar(50) DEFAULT NULL,
   source_encoding varchar(45) DEFAULT NULL,
   title varchar(100) DEFAULT NULL,
   author varchar(100) DEFAULT NULL,
   crawltime date DEFAULT CURRENT_TIMESTAMP,
   publish_date date DEFAULT CURRENT_TIMESTAMP,
   content text,
   category text DEFAULT NULL,
   read_num integer DEFAULT NULL,
  PRIMARY KEY (id_fetches)
);

CREATE TABLE Splitwords (
   id_word serial UNIQUE,
   id_fetches int,
   word varchar(50) DEFAULT NULL,
);

CREATE TABLE WordWeight (
   id_fetches int,
   word varchar(50) DEFAULT NULL,
   weight integer
);