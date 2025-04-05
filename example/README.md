Compile example:

```shell
gcc -fPIC -fprofile-arcs -ftest-coverage -o main main.c && ./main
```

Generate lcov file using `lcov`:

```shell
lcov --capture --directory . --output-file lcov.info --rc lcov_branch_coverage=1
```