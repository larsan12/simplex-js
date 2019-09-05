
/**
 * последняя строчка - целевая функция, остальные - ограничения
 * 
 * input table = [
 *  [4, -2, 2, 0, 12],
 *  [1, 2, 2, 4, 30],
 *  [-2, 4, 2, 1, 36],
 *  [3, 4, 2, 3, 0]
 * ]
 * 
 * types = [
 *  ">=", 
 *  "<=", 
 *  ">=",
 *  "min"
 * ]
 */

let table, horisont_x, vertical_x, free, max_x, func

/**
 * 
 * Приведение к каноническому виду
 * 
 */

const main = (inputTable, types) => {

    max_x = inputTable[0].length - 1

    // если f => max меняем на min
    if (types[types.length - 1] == "max") {
        inputTable[types.length - 1] = inputTable[types.length - 1].map(v => v * -1)
        types[types.length - 1] = "min"
    }
    free = []
    for (var k=0; k < inputTable.length - 1; k++){
        free[k] = inputTable[k][max_x]
    }
    free[inputTable.length - 1] = 0

    //избавляемся от отрицательных значений в свободных членах
    free.forEach((e, i) => {
        if (e < 0) {
            free[i] = -e
            inputTable[i] = inputTable[i].map(v => v * -1)
            switch (types[i]) {
                case ">=":
                    types[i] = "<="
                    break;
                case "<=":
                    types[i] = ">="
                    break;
                default:
                    break;
            }
        }
    })

    //TODO удалить переменные без ограничений

    //запоминаем массив основных переменных переменных
    let origin_x = Array(inputTable[0].length - 1).fill(0).map((v, i) => i)
    //console.log("Базовые переменные имеют индексы: " + origin_x)
    
    //дополнительные переменные
    let add_x = []

    //массив искуственных переменных (координаты)
    let r_arr_y = []
    let r_arr_x = []

    //базис 
    let arr_x = Array(inputTable.length - 1).fill(0)

    //избавляемся от неравенств (столбцы)
    types.forEach((t,i) => {
        if (t != "=" && i != types.length - 1) {
            let k = t == ">=" ? -1 : 1
            let vals = Array(types.length).fill(0)
            vals[i] = k
            if (k == 1) {
                arr_x[i] = inputTable[0].length - 1
            } else {
                r_arr_y.push(i)
            }
            add_x.push(inputTable[0].length - 1)
            max_x += 1
            addNewVariable(inputTable, vals)
        }
    })

    //console.log("Добавили вспомогательные переменные " + add_x)

    // искуственные переменные для вспомогательной задачи
    r_arr_y.forEach((v, i) => {
        arr_x[v] = inputTable[0].length - 1
        r_arr_x.push(inputTable[0].length - 1)
        let vals = Array(types.length).fill(0)
        vals[v] = 1
        max_x += 1
        addNewVariable(inputTable, vals)
    })

    let main_x

    if (r_arr_x.length) {
        //console.log("Добавили искуственный базис " + r_arr_x)

        //console.log("Решаем вспомогательную задачу")
        //console.log("Без вспомогательной функции")
        //printTable(inputTable)

        // составляем вспомогательную целевую функцию
        setAuxiliaryFunction(r_arr_x, r_arr_y, inputTable)

        //заменяем целевую функцию на вспомогательную для решения дополнительной задачи

        //console.log("С вспомогательной функцией")
        //printTable(inputTable)

        main_x = makeSimplexTable(inputTable, arr_x)
        //заменяем целевую ф. на вспомогательную
        let mainFunc = inputTable[inputTable.length - 2]
        inputTable.remove(inputTable.length - 2)

        //console.log("Симплекс таблица")
        //printTable(inputTable)

        func = mainFunc

        simplex(inputTable, main_x, arr_x, func)

        //console.log("Решение есть, убираем искуственные переменные: " + r_arr_x)

        // заменяем вспомогательную функцию основной
        table[table.length - 1] = func
        func = undefined    
        // удаляем искуственный базис
        r_arr_x.forEach(v => {
            let index;
            if (vertical_x.indexOf(v) > -1) {
                index = vertical_x.indexOf(v)
                vertical_x.remove(index)
                table.remove(index)
            }
            if (horisont_x.indexOf(v) > -1) {
                index = horisont_x.indexOf(v)
                horisont_x.remove(index)
                for (let i = 0; i < table.length; i++) {
                    table[i].remove(index)
                }
            }
        })

        //printTable(table)

        inputTable = table
        main_x = horisont_x
        arr_x = vertical_x
    } else {
        main_x = makeSimplexTable(inputTable, arr_x)
        //console.log("Симплекс таблица")
        //printTable(inputTable)
    }

    // Есть ли  отрицательные элементы в коэфициентах функции (последняя строчка) ?
    if (findMin(inputTable[inputTable.length-1], false, true) < 0) {
        iteration = 0 // счетчик итераций, для защиты от зависаний
        simplex(inputTable, main_x, arr_x)
        inputTable = table
        main_x = horisont_x
        arr_x = vertical_x
    }

    //console.log("Итоговая таблица")

    //printTable(inputTable)
    
    let resolve = Array(origin_x.length).fill(0);
    vertical_x.forEach((v, i) => {
        if (origin_x.indexOf(v) != -1) {
            resolve[v] = inputTable[i][inputTable[0].length - 1]
        }
    })

    //console.log("Вектор - решение: " + resolve.map(v => " " + v))
    return resolve

}

// делаем симплекс таблицу, возвращаем массив индексов по Х
const makeSimplexTable = (matrix, basis) => {
    let result = []
    matrix[0].forEach((v, i) => {
        if (!basis.some(b => b == i)) {
            result.push(i)
        }
    })
    let basisSort = basis.slice()
    basisSort.sort((a, b) => a < b).forEach(b => removeColumn(matrix, b))
    return result
}

Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

//удалить столбец
const removeColumn = (matrix, index) => matrix.forEach((v, i) => v.remove(index))


// высчитать вспомогательную целевую функцию
const setAuxiliaryFunction = (r_x, r_y, matrix) => {
    let result = Array(matrix[0].length).fill(0)
    r_y.forEach((i, v_i) => {
        for (let j = 0; j < matrix[0].length; j++) {
            if (j != r_x[v_i]) {
                if (j != matrix[0].length - 1) {
                    result[j] += -matrix[i][j]
                } else {
                    result[j] += -matrix[i][j]
                }
            }
        }
    })
    matrix.push(result)
}

// добавить переменную где arr - значение коэфициента при переменной в каждом ограничении
const addNewVariable = (matrix, arr) => {
    matrix.forEach((v, i) => {
        let freeVar = v[v.length - 1]
        v[v.length - 1] = arr[i]
        v.push(freeVar)
        matrix[i] = v
    })
}

const removeVariable = (i) => {

}

// симплекс метод, func - целевая функция, если решаем вспомогательную задачу
const simplex = (matrix, x, y, funcDop) => {
    //console.log("Старт симплекс метода")
    // Матрица свободных членов
    free = []
    table = matrix
    horisont_x = x
    vertical_x = y
    max_x = matrix[0].length - 1
    for (var k=0; k < matrix.length - 1; k++){
        free[k] = matrix[k][max_x]
    }
    if (!funcDop) {
        free[matrix.length - 1] = 0
    } else {
        free[matrix.length - 1] = matrix[matrix.length - 1][max_x]
    }

    if (findMin(matrix[matrix.length-1], false, true) < 0) {
        iteration = 0 // счетчик итераций, для защиты от зависаний
        simplexStep() // Переходим к шагу 2
    }

}

const simplexStep = () => {
    iteration++
    // находим ведущий столбец
    let min_col_num = findMin(table[table.length-1], true, true)
    
    // находим ведущую строку
    let cols_count = table[0].length - 1
    let min_row_num = 999
    // эмпирический коэфициент, тк мы не знаем, положително ли нулевое отношение
    let min_row = 9999
    let tmp = 0
    let limit = table.length - 1
    for (i = 0; i < limit; i++){
        tmp = free[i]/table[i][min_col_num]
        if (tmp < min_row && tmp>=0) {
            min_row_num = i
            min_row = tmp
        }
    }
    
    let min_k1_num = min_col_num
    let min_k_num = min_row_num
    
    // Печатаем таблицу и выделяем на ней ведущие строку и столбец
    //printTable(table, min_k_num, min_k1_num)

    // Обновляем индексы элементов по горизонтале и вертикале
    tmp = horisont_x[min_k1_num]
    horisont_x[min_k1_num] = vertical_x[min_k_num]
    vertical_x[min_k_num] = tmp
    // Если мы не нашли ведущую строку (999 - это наш эмпирический коэфициент)
    if (min_row_num == 999){
        //console.log('функция не ограничена')
        return false
    }

    // Замена	
    updateTable(min_k_num, min_k1_num)
    // матрица свободных членов
    for (let k=0; k < table.length; k++){
        free[k] = table[k][max_x]
    }
    //printTable(table, min_k_num, min_k1_num)

    // нужно ли еще разок пройти второй шаг ?	
    if (findMin(table[table.length-1], false, true) < 0 && iteration < 10) {
        simplexStep()
    } else {
        return table
    }

}

// Функция обновления таблицы
const updateTable = (min_k_num, min_k1_num) => {
    let table1 = []
    let func1
    if (func) { 
        func1 = Array(func.length).fill(0)
    }
    for (i = 0; i< table.length; i++){
        table1[i] = []
        if (i != table.length - 1 || !func) {
            for (j = 0; j< table[0].length; j++){
                if (i == min_k_num && j ==min_k1_num){
                    table1[i][j] = 1/table[i][j]
                } else {
                    if (i == min_k_num){
                        table1[i][j] = table[i][j]/table[min_k_num][min_k1_num]
                    } else {
                        if (j == min_k1_num){
                            table1[i][j] = -table[i][j]/table[min_k_num][min_k1_num]
                        } else {
                            table1[i][j] = table[i][j] - table[i][min_k1_num]*table[min_k_num][j]/table[min_k_num][min_k1_num]
                        }
                    }
                }
                table1[i][j] = Math.round(table1[i][j]*1000)/1000;
            }
        } else {
            for (j = 0; j< table[0].length; j++){
                if (i == min_k_num && j ==min_k1_num){
                    table1[i][j] = 1/table[i][j]
                    func1[j] = 1/func[j]
                } else {
                    if (i == min_k_num){
                        table1[i][j] = table[i][j]/table[min_k_num][min_k1_num]
                        func1[j] = func[j]/table[min_k_num][min_k1_num]
                    } else {
                        if (j == min_k1_num){
                            table1[i][j] = -table[i][j]/table[min_k_num][min_k1_num]
                            func1[j] = -func[j]/table[min_k_num][min_k1_num]
                        } else {
                            table1[i][j] = table[i][j] - table[i][min_k1_num]*table[min_k_num][j]/table[min_k_num][min_k1_num]
                            func1[j] = func[j] - func[min_k1_num]*table[min_k_num][j]/table[min_k_num][min_k1_num]
                        }
                    }
                }
                table1[i][j] = Math.round(table1[i][j]*1000)/1000;
                func1[j] = Math.round(func1[j]*1000)/1000;
            }
        }
    }
    table = table1;
    func = func1

    return false;

}

const printTable = (table, row, col) => {
    //console.log("_".repeat((horisont_x ? table[0].length + 1 : table[0].length) * 10))
    if (horisont_x) {
        let firstString = "__basis__|"
        horisont_x.forEach((v, i) => {
            if (i != horisont_x.length - 1) {
                let count = 9 - v.toString().length
                firstString += v + "_".repeat(count > 0 ? count : 0) + "|"
            } else {
                let count = 10 - v.toString().length
                firstString += v + "_".repeat(count > 0 ? count : 0)
            }
        })
        //console.log(firstString)
    }
    table.forEach((e, j) => {
        let str = ""
        if (vertical_x) {
            if (j != table.length - 1) {
                let count = 9 - vertical_x[j].toString().length
                str += vertical_x[j] + ".".repeat(count > 0 ? count : 0) + "|"
            } else {
                let count = func ? 4 : 3
                str += (func ? "f_add" : "f_main") + ".".repeat(count > 0 ? count : 0) + "|"
            }
        }
        e.forEach((n, i) => {
            let count = 10 - n.toString().length
            if (i == col || i == col - 1 || i == e.length - 2) {
                count = 9 - n.toString().length
            }
            let point
            if (j == row || j == row - 1) {
                point = n + ".".repeat(count > 0 ? count : 0)
            } else if (j == table.length - 2) {
                point = n + "_".repeat(count > 0 ? count : 0)
            } else if (j == table.length - 1) {
                point = n + "_".repeat(count > 0 ? count : 0)
            } else {
                point = n + " ".repeat(count > 0 ? count : 0)
            }
            if (i == col || i == col - 1) {
                point += ";"
            } else if (i == e.length - 2) {
                point += "|"
            }
            str += point
        })
        //console.log(str)
    })

    if (func) {
        let str = "f_main" + ".".repeat(3) + "|"
        func.forEach((v,i) => {
            let count = 10 - v.toString().length
            str += v + "_".repeat(count > 0 ? count : 0)
        })
        //console.log(str)
    }
    //console.log("")
    //console.log(".....................................................")
    //console.log("")
}


// Поиск минимального элемента
const findMin = (v, needNumber, notLast) => {
    let m = v[0];
	let num = 0;
	let len = 0;
	
	if (notLast) {
		len = v.length-2;
	} else {
		len = v.length-1;
	}
    for (var i=1; i <= len; i++) { 
		if (v[i] < m) {
			m = v[i]
			num = i
		}
    }
	
	if (needNumber) {
		return num
	} else {
		return m
	}
}


let m = [
    [4, -2, 2, 0, 12],
    [1, 2, 2, 4, 30],
    [2, -4, -2, -1, -36],
    [-3, -4, -2, -3, 0]
]

let t = [
    ">=", 
    "<=", 
    "<=",
    "max"
]
/*
let m = [
    [2, 12, 20],
    [4, 6, 32],
    [3, 0, 14],
    [0, 18, 42],
    [12, 10, 0]
]

let t = [
    ">=",
    ">=",
    ">=",
    ">=",
    "min"
]

let m = [
    [-1, 1, 1],
    [1, 3, 15],
    [-2, 1, 4],
    [3, 1, 0]
]

let t = [
    ">=",
    "<=",
    "<=",
    "max"
]
*/

module.exports = main;