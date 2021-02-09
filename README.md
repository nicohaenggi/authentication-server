<p align="center"><img src="https://github.com/nicohaenggi/authentication-server/blob/master/docs/auth-welcome.png" alt="Authentication Server Email"></p>

# KeepFocus

[![Status](https://img.shields.io/github/last-commit/nicohaenggi/authentication-server.svg?style=flat-square)](https://github.com/nicohaenggi/authentication-server/commits/master)
[![GitHub Issues](https://img.shields.io/github/issues/nicohaenggi/authentication-serversvg?style=flat-square)](https://github.com/nicohaenggi/authentication-server/issues)
[![License](https://img.shields.io/badge/license-MIT-orange.svg?style=flat-square)](https://github.com/nicohaenggi/authentication-server/blob/master/LICENSE)
[![Version](https://img.shields.io/github/v/release/nicohaenggi/authentication-server.svg?style=flat-square)](https://github.com/nicohaenggi/authentication-server/releases)

**Authentication Server** is a modern *OpenID Conncect Provider* for Node.js, implementing a broad range of different *OAuth 2.0 Grant Types* flows. In addition, this project offers local authentication, by allowing users to signup, login and even reset their passwords. This registration process is implemented using transactional emails and follows the latest security practices.

_Contributions, feature requests and bug reports are always welcome. Be sure to head over to [Contributing](#contributing) for a detailed guide on how to contribute._

## Table of Contents

- [Features](#features)
- [Setup](#setup)
- [Contributing](#contributing)
- [Copyright](#copyright)

## Features

First, **Authentication Server** is free to use and you can deploy it on your own servers as you wish. The OAuth 2.0 implementation is structured in such a way that adding a custom *Grant Type* has been facilitated. In addition, this project offers the following features:

- Fully featured OpenID Connect Provider
- OAuth 2.0 Multiple Response Types
- OAuth 2.0 Client Credentials Grant
- OAuth 2.0 Password Grant Type
- OAuth 2.0 Refresh Token Grant Type
- OAuth 2.0 Bearer Token Usage
- Custom OAuth Grant Type, implemented [here](https://github.com/nicohaenggi/authentication-server/blob/master/src/oauth/grant-types/password-security-grant-type.ts)
- Local authentication
- Transactional emails (user registration, password reset)
- Admin REST API with API Key
- Linking user accounts to a Discord user
- **Basic SaaS support**: adding subscriptions (*aka licenses*) to user accounts, with given expiry, using Admin API

## Setup

### Manual

You need to have [Node.js](https://nodejs.org/) along with [MongoDB](https://www.mongodb.com/) (*can also be a seperate instance*) installed. We recommend the **LTS release**. After having sucessfully installed both applications, follow the steps below:

1. Clone this repository or [download the latest zip](https://github.com/nicohaenggi/authentication-server/releases).
2. Copy `config/production-example.json` to `config/production.json` and fill it properly ([see below](#configuration)).
3. Install dependencies: `npm install`.
4. To run for development, open a new Terminal window and run `npm watch-ts` to watch for file changes. Then execute `npm start` to start the application.
5. To run for production, run `npm run build` and then `NODE_ENV=production npm start`.
6. If you want to use `pm2`, run the following command: `NODE_ENV=production pm2 start dist/server.js --name "AuthServer"`

### Configuration

For a minimal working configuration, the following settings have to be changed in the `config/production-example.json`-file:

- `mongo.url`: The URL to your *MongoDB* database instance.
- `mongo.user`: The username used to acess the *MongoDB* database.
- `mongo.pass`: The password used to access the *MongoDB* database.
- `jwt.issuer`: The predefined `issuer` claim in the JSON Web Token (JWT)
- `api.key`: The API key in order to access the admin features, e.g. fetch user data.
- `email`: The *SMTP server* to relay the transactional emails such as user registration.
- `email.shouldSend`: Defines whether the emails should actually be sent or only opened in browser. Usually set to `false` in development mode.
- `discord`: The discord bot credentials that links a user account with a respective Discord user.
- `redirects`: The frontend redirects that should be made after a process flow has finished, e..g redirecting to a specifc page after the email has been sucessfully verified.

## Contributing

If you discover a bug in the authentication server, please [search the issue tracker](https://github.com/nicohaenggi/authentication-server/issues?q=is%3Aissue+sort%3Aupdated-desc) first. If it hasn't been reported, please [create a new issue](https://github.com/nicohaenggi/authentication-server/issues/new).

### [Feature Requests](https://github.com/nicohaenggi/authentication-server/labels/Feature%20Request)
If you have a great idea to improve the authentication server, please [search the feature tracker](https://github.com/nicohaenggi/authentication-server/labels/Feature%20Request) first to ensure someone else hasn't already come up with the same idea. If it hasn't been requested, please [create a new request](https://github.com/nicohaenggi/authentication-server/issues/new). While you're there vote on other feature requests to let the me know what is most important to you.

### [Pull Requests](https://github.com/nicohaenggi/authentication-server/pulls)
If you'd like to make your own changes ensure your Pull Request is made against the `dev` branch.

# Copyright

Copyright (c) 2021 Nico Haenggi - Released under the [MIT License](https://github.com/nicohaenggi/authentication-server/blob/master/LICENSE)