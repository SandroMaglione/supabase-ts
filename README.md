# `supabase-ts`

<p>
  <a href="https://github.com/SandroMaglione/supabase-ts">
    <img src="https://img.shields.io/github/stars/SandroMaglione/supabase-ts?logo=github" />
  </a>
  <img src="https://img.shields.io/github/repo-size/SandroMaglione/supabase-ts" />
  <img src="https://img.shields.io/github/license/SandroMaglione/supabase-ts?logo=github" />
  <img src="https://img.shields.io/github/contributors-anon/SandroMaglione/supabase-ts" />
  <a href="https://github.com/SandroMaglione">
    <img alt="GitHub: SandroMaglione" src="https://img.shields.io/github/followers/SandroMaglione?label=Follow&style=social" target="_blank" />
  </a>
  <a href="https://twitter.com/SandroMaglione">
    <img alt="Twitter: SandroMaglione" src="https://img.shields.io/twitter/follow/SandroMaglione.svg?style=social" target="_blank" />
  </a>
</p>

<a href="https://www.buymeacoffee.com/sandromaglione">
    <img src="https://shields.io/badge/sandromaglione-Support--me-FFDD00?logo=buy-me-a-coffee&style=for-the-badge&link=https://www.buymeacoffee.com/sandromaglione" />
</a>

What happens when the type of the response from a supabase request is different from expected? We don't want our app to crash, do we? 

Welcome `supabase-ts`!

Make request to [supabase](https://supabase.io/) using the power of [fp-ts](https://gcanti.github.io/fp-ts/), [io-ts](https://gcanti.github.io/io-ts/), and parsing.

Use [supabase](https://supabase.io/) with Functional Programming and [fp-ts](https://gcanti.github.io/fp-ts/).

## Getting started

```shell
npm install supabase-ts
```

Extend your usual `SupabaseClient` using `createClientIO` from `supabase-ts`.

`createClientIO` accepts two generic types:
- A union of `string` with the names of all the tables/views of your database. `supabase-ts` will enforce the correct table names, no more typos!
- The default request error type

```ts
import { createClient } from '@supabase/supabase-js';
import { createClientIO } from 'supabase-ts';

// Enforce tables and views names
type SupabaseTable = 'table1' | 'table2';
type SupabaseView = 'view1' | 'view2';

// Define default request error type
type ErrorMessage = string;

const supabaseClient = createClient('URL', 'KEY');
export const supabase = createClientIO<SupabaseTable | SupabaseView, ErrorMessage>(supabaseClient);

```

Use the exported `supabase` client to perform requests:
- `requestListWithValidation`: Perform a request to supabase and return a list of values.
- `requestSingleWithValidation`: Perform a request to supabase and return a single value.

For every request you must provide an [`io-ts`](https://github.com/gcanti/io-ts) type used to validate the response from supabase. `supabase-ts` will make sure that the shape of the return data respects the defined schema from `io-ts`.

```ts
const schema = t.type({ name: t.string });
type Schema = t.TypeOf<typeof schema>;
const tableValidated = {
  name: 'table1', // Required to be `string` from `SupabaseTable | SupabaseView`!
  schema,
} as const; // Required to be `const` for type-safety

const responseList: TE.TaskEither<string, readonly Schema[]> =
  supabaseClientIO.requestListWithValidation(tableValidated)(
    (query) => query.select(),
    {
      // Handle all possible errors
      onNoDataError: () => '',
      onRequestError: () => '',
      onValidationError: () => '',
    }
  );

const responseSingle: TE.TaskEither<string, Schema> =
  supabaseClientIO.requestSingleWithValidation(tableValidated)(
    (query) => query.select(),
    {
      // Handle all possible errors
      onZeroData: () => '',
      onNoDataError: () => '',
      onRequestError: () => '',
      onValidationError: () => '',
    }
  );
```


## 📃 Versioning

- `v0.2.1` - 27 November 2021
- `v0.1.3` - 24 September 2021
- `v0.1.2` - 18 September 2021
- `v0.1.1` - 17 September 2021
- `v0.1.0` - 17 September 2021

## 😀 Support

Currently the best way to support me would be to follow me on my [**Twitter**](https://twitter.com/SandroMaglione).

Another option (or `Option`) would be to buy me a coffee.

<a href="https://www.buymeacoffee.com/sandromaglione">
<img src="https://shields.io/badge/sandromaglione-Support--me-FFDD00?logo=buy-me-a-coffee&style=for-the-badge&link=https://www.buymeacoffee.com/sandromaglione" />
</a>

## 👀 License

MIT License, see the [LICENSE.md](https://github.com/SandroMaglione/supabase-ts/blob/main/LICENSE) file for details.