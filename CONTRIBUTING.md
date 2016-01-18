# Contributing

Thanks so much for taking the time to help make Surge better! The Surge CLI (this repository) and a great deal of Surge’s underlying infrastructure is open source software.

## Fixing bugs

If you take the time to document a problem and share it with us, even a seemingly minor one, it’s greatly appreciated, and a totally valid contribution to this open source project. Thank you!

## Running locally

To get the project setup locally, run the following commands in your terminal:

```sh
git clone https://github.com/sintaxi/surge
cd surge

# Install dependencies
npm install

# Run the tests
npm test
```

If you are running Surge as a platform locally, you will be able to run all the tests against your local endpoint:

```sh
# Run the tests against the local endpoint
npm run test:local
```

## Feature requests

## Submitting Pull Requests

We love pull requests. Here’s a quick guide:

1. Run this project locally:

  ```sh
  git clone https://github.com/sintaxi/surge
  cd surge

  # Install dependencies
  npm install

  # Run the tests
  npm test
  ```

2. Create a topic branch for your changes:

  It can be helpful if you prefix the branch name with your initials, like `ko-` or `bw-`:

  ```sh
  git checkout -b ex-

  ```
3. Commit a failing test for the bug:

  ```sh
  git commit -am "Adds a failing test to demonstrate that thing"
  ```

4. Commit a fix that makes the test pass:

  ```sh
  git commit -am "Adds a fix for that thing!"
  ```

5. Run the tests:

  ```sh
  npm test
  ```

6. If everything looks good, push to your fork:

  ```sh
  git push origin fix-for-that-thing
  ```

7. [Submit a pull request.](https://help.github.com/articles/creating-a-pull-request)

8. _Optional_ Record a gif to show off your hard work

  We have our fork that will help you record gifs, which are a really nice way to showcase the changes you’ve made, and make it dramatically easier for us and the community to comment on the PR.

9. Enjoy being the wonderful person you are

  Thanks so much for your contribution! We generally are pretty timely about reviewing Pull Requests, but if you think we’ve missed anything 
