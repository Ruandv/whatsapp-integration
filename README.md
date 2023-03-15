# whatsapp-integration

Whatsapp-Integration is a nodejs application that will monitor incomming whatsapp messages and respond accordingly.
It integrates loadshedding schedules for South Africa (work in progress) and also ChatGPT if your message does not relate to loadshedding.

## Pre-requisites

You need to generate two api tokens:

**ChatGPT** : <https://platform.openai.com/>

**Eskom se Push** : <https://eskomsepush.gumroad.com/l/api>

## Installation

create an .env file by running this script

```bash
cp .env.example ./.env
```

Replace the `YOUR_KEY` with the keys you received when registering on the two websites.

Use the yarn package manager [yarn](https://yarnpkg.com/) to install all the dependencies.

Install the dependencies

```bash
yarn install
```

Clean out the dist folder

```bash
yarn clean
```

Transpile the code into javascript

```bash
yarn build
```

Run the code locally

```bash
yarn start
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
