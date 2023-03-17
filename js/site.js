let tasks = [];
const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];
const PRIORITIES = ['LOW', 'MED', 'HIGH'];

function persist(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function get(key) {
    return JSON.parse(localStorage.getItem(key));
}

function findTaskIndexByTaskId(taskId) {
    console.log(`looking for taskId ${taskId}`);
    let index = tasks.findIndex(task => task.id == taskId);
    console.log(`found at index ${index}`);
    return index
}

function saveTask() {
    // get form fields
    let newTask = getFormFields();
    
    // validate the task
    let errors = validateTask(newTask);
    console.log(errors)
    if (errors.length > 0) {
        // display error messages
        $('#modal-error-box').empty();
        let errorHtml = errors.reduce((prev, curr) => prev + `<li>${curr}</li>`, '');
        
        $('#modal-error-box').append(`<ul>${errorHtml}</ul>`);
    }
    else {
        // does this task already exist?
        let index = findTaskIndexByTaskId(newTask.id);
        if (index === -1) {
            console.log('adding new task')
            tasks.push(newTask);
        } else {
            console.log('updating task')
            tasks[index] = newTask;
        }
        
        // validate form fields
        $('#tasksModal').modal('hide');

        // persist the change
        persist('tasks', tasks);

        initializeBoard();
    }
}

function getFormFields() {
    let priorityValue = ($('#low-priority').is(':checked') ? 'LOW' : $('#med-priority').is(':checked') ? 'MED': 'HIGH');
    let dateArray = $('#task-has-due-date').val().split('-');
    console.log($('#has-task-id').val() || generateTaskId());
    console.log(dateArray);

    let temp = {
        id: $('#has-task-id').val() || generateTaskId(),
        title: $('#task-has-title').val(),
        epic: $('#task-has-epic').val(),
        dueDate: new Date(`${dateArray[0]}-${dateArray[1]}-${dateArray[2]}`),
        priority: priorityValue,
        description: $('#task-has-description').val(),
        isBlocked: false,
        status: STATUSES[0]
    }

    console.log(temp);
    return temp;
}

function generateTaskId() {
    return (Math.round(Math.random() * 1000000) * 47);
}

function editTask(taskId, field, value) {
    console.log(`Editing task ${taskId}`);
    const index = tasks.findIndex(task => task.id === taskId);
    const prev = tasks[index][field]
    tasks[index][field] = value;
    console.log(`Edited task ${field} from ${prev} to ${value}`);

    persist('tasks', tasks);

    initializeBoard();
}

function toggleBlocker(taskId) {
    const index = findTaskIndexByTaskId(taskId);
    const current = tasks[index]['isBlocked'];
    console.log(`task ${taskId} is ${tasks[index]['isBlocked']}`)
    editTask(taskId, 'isBlocked', !current);
}

function moveTask(taskId, step) {
    console.log(`moving task ${taskId} ${step === 1 ? 'forward' : 'backward'}`);

    const index = tasks.findIndex(task => task.id === taskId);
    const currentState = tasks[index]['status'];
    let nextStateIndex = (STATUSES.indexOf(currentState) + step);
    console.log(nextStateIndex);

    let nextState = STATUSES[nextStateIndex];
    editTask(taskId, 'status', nextState);
}

function removeTask(taskId) {
    console.log(`removing task ${taskId}, 1 of (${tasks.length})`)
    let index = findTaskIndexByTaskId(taskId);
    tasks.splice(index, 1);
    console.log(`total tasks remaining ${tasks.length}`);

    persist('tasks', tasks);

    // rebuild board
    initializeBoard();
}

function getDaysRemaining(dueDate) {
    return Math.round((dueDate.getTime() - Date.now()) / (1000 * 3600 * 24));
}

function compareTasks(a, b) {
    let result = 0;
    if (PRIORITIES.indexOf(a.priority) > PRIORITIES.indexOf(b.priority)) { result = -1; } 
    else if (PRIORITIES.indexOf(a.priority) < PRIORITIES.indexOf(b.priority)) { result = 1; } 
    else if (new Date(a.dueDate).getTime() > new Date(b.dueDate).getTime()) { result = 1; }
    else if (new Date(a.dueDate).getTime() < new Date(b.dueDate).getTime()) {result = -1; }

    // console.log(`comparing: ${a.priority} / ${a.dueDate} to ${b.priority} / ${b.dueDate} -> ${result}`)
    return result;
}

function validateTask(task) {
    let errors = []
    // is there a title?
    if (!task.title) { errors.push('Title is a required field'); }

    // is there a description?
    if (!task.description) { errors.push('Description is a required field'); }

    // is title unique?
    if (task.title && tasks.filter(t => t.title === task.title).length > 0) { errors.push('Title must be unique'); }

    return errors;
}

function toggleModal(taskId) {
    $('#tasksModal').modal('toggle');
    if (taskId) {
        // get task
        let task = tasks[findTaskIndexByTaskId(taskId)];
        if (task) {
            // get date and format it
            let taskDate = new Date(task?.dueDate);
            let formattedDate = `${taskDate.getFullYear()}-${('0'+(taskDate.getMonth()+1)).slice(-2)}-${('0'+taskDate.getDate()).slice(-2)}`;
            
            // pre-fill modal fields with task data
            $('#has-task-id').val(task.id);
            $('#task-has-title').val(task.title);
            $('#low-priority').val(task.priority === PRIORITIES[0]);
            $('#med-priority').val(task.priority === PRIORITIES[1]);
            $('#high-priority').val(task.priority === PRIORITIES[2]);
            $('#task-has-due-date').val(formattedDate);
            $('#task-has-epic').val(task.epic);
            $('#task-has-description').val(task.description);
        }
    }
}

function getTasks(criteria) {
    tasks = get('tasks') || [];

    let tempTasks = [];
    if (tasks?.length === 0) {
        for (let i=0; i<6; i++) {
            let due = new Date();
            due.setDate(due.getDate() + (Math.round(Math.random() * 30,1)));
            let temp = {
                id: generateTaskId()+i, 
                title: `Task ${i}`,
                dueDate: due, 
                epic: 'Epic Name', 
                priority: PRIORITIES[(i*i)%3], 
                description: 'description', 
                status: STATUSES[i%3],
                isBlocked: false
            };
            tempTasks.push(temp);
        }
        tempTasks.sort(compareTasks);
        console.log(tempTasks);
        tasks = tempTasks
    }

    tasks.sort(compareTasks);
    return tasks;
}

function getPriorityColor(priority) {
    const colors = ['GREEN', 'YELLOW', 'RED'];
    return colors[PRIORITIES.indexOf(priority)];
}

function formatDate(date) {
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    let day = date.getDate();
    let month = monthNames[date.getMonth()];
    let year = date.getFullYear();
    return `${day} ${month} ${year}`
}

function buildCard(data) {
    return `<div id="${data.id}" class="card">
                    <div class="card-header text-end">
                        <i id="block-${data.id}" class="fa fa-flag" style="color: ${data.isBlocked ? 'red' : 'black'}" aria-hidden="true" onclick="toggleBlocker(${data.id})"></i>
                        <i id="left-${data.id}" class="fa fa-arrow-left" aria-hidden="true" onclick="moveTask(${data.id}, -1)"></i>
                        <i id="right-${data.id}" class="fa fa-arrow-right" aria-hidden="true" onclick="moveTask(${data.id}, 1)"></i>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${data.isBlocked ? '<span style="background: red">BLOCKED:</span>': ''} ${data.title}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">${data.epic}</h6>
                        <hr>
                        <div class="row">
                            <div class="col-sm-6">Due: ${formatDate(new Date(data.dueDate))}
                                <br>
                                Days Remaining: ${getDaysRemaining(new Date(data.dueDate)) < 1 ? '<span style="color:red">PAST DUE</span>' : getDaysRemaining(new Date(data.dueDate))}</div>
                            <div class="col-sm-6" data-bs-toggle="tooltip" data-bs-placement="top" title="${data.priority}" >Priority: <i class="fa fa-circle" style="color: ${getPriorityColor(data.priority)}"></i> </div>
                        </div>
                        <hr>
                        <div class="card-text">${data.description}</div>
                        <div class="card-text">TODO: add comments section</div>
                    </div>
                    <hr>
                    <div class="card-footer text-muted">
                        <div><i id="edit-${data.id}" onclick="toggleModal(${data.id})" class="fa fa-pencil" aria-hidden="true"></i></div>
                        <div class="text-end"><i id="remove-${data.id}" class="fa fa-trash" aria-hidden="true" onclick="removeTask(${data.id}, 1)"></i></div>
                    </div>
            </div>`;
}

function initializeBoard() {
    // get all tasks
    tasks = getTasks();
    console.log(tasks.length)

    STATUSES.forEach(state => {
        let tempColId = `#${state.toLowerCase().replace('_', '-')}-cards`;

        // clear todo swimlane, filter down to just todo, build cards for todo tasks
        $(tempColId).empty()
        tasks?.filter(task => task.status === state)
            .forEach(task => $(tempColId).append(buildCard(task)));
    });

}

$( document ).ready(function() {
    initializeBoard();
  });