CREATE TABLE news (
        id int(11) NOT NULL AUTO_INCREMENT,
        title varchar(128) NOT NULL,
        slug varchar(128) NOT NULL,
        text text NOT NULL,
        PRIMARY KEY (id),
        KEY slug (slug)
);

INSERT INTO news (title, slug, text) VALUES ('Hello World', 'hello-world', 'Hellow World!');
INSERT INTO news (title, slug, text) VALUES ('Test World', 'test-world', 'Test World!');