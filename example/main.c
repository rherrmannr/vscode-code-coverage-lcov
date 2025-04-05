#include <stdbool.h>

int foo(int i, bool b) {
    if (i == 1) {
        return 0;
    }
    if (b && i == 2) {
        return 0;
    }
    return 0;
}

int main() {
    // foo(1, true);
    foo(2, false),
    foo(3, true);
}
