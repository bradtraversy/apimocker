process.env['NODE_ENV'] = 'test';
process.env['DATABASE_URL'] ||= 'postgresql://unit:unit@localhost:5432/apimocker_unit';
