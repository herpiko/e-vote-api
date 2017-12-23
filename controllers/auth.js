'use strict';

const Models        = require('../models');
const Bcrypt        = require('bcrypt');
const Boom          = require('boom');
const JwToken       = require('../plugins/jwToken');
const Sequelize     = require('sequelize');
const Axios         = require('axios');
const Querystring   = require('querystring');

module.exports = {

    register: (request, reply) => {

        const attributes = request.payload;

        Models.User.create(attributes).then((userCreated) => {

            return reply({
                statusCode: 200,
                data: userCreated
            }).code(200);

        }).catch(Sequelize.ValidationError, (err) => {

            // respond with validation errors
            return reply({
                statusCode: 400,
                error: 'Bad Request',
                message: err.errors[0].message
            }).code(400);

        })
            .catch((err) => {

                console.log(err);
                return reply(err);

            });

    },

    loginSisfo: (request, reply) => {

        Axios.post('https://info.nurulfikri.ac.id/sisfo/api/user/', Querystring.stringify({
            token: request.payload.token,
            nim: request.payload.nim,
            password: request.payload.password
        })
        ).then((response) => {

            const results = response.data;

            const userObject = {
                'nim': results.data.nim,
                'name': results.data.nama,
                'programStudi': results.data.prodi,
                'tahunAngkatan': results.data.tahun_angkatan,
                'status': results.data.status_mhsw,
                'avatar': results.data.url_foto
            };

            Models.User.findOne({
                where: {
                    nim: request.payload.nim
                }
            }).then((checkUser, error) => {

                if (!checkUser) {

                    Models.User.create(userObject).then((user) => {

                        userObject.userId = user.userId;

                        reply({
                            statusCode: 200,
                            data: user,
                            secretToken: JwToken.issue({
                                user
                            })
                        }).code(200);

                    }).catch(Sequelize.ValidationError, (err) => {

                        // respond with validation errors
                        return reply({
                            statusCode: 400,
                            error: 'Bad Request',
                            message: err.errors[0].message
                        }).code(400);

                    });
                }
                // else {
                //     return reply(Boom.notFound('Sorry, Kamu telah login!'));
                // }

                reply({
                    statusCode: 200,
                    data: checkUser,
                    secretToken: JwToken.issue({
                        checkUser
                    })
                }).code(200);

            });
        }).catch((error) => {

            // console.log(error);
            return reply(Boom.unauthorized('Invalid nim or password'));

        });

    }

};
