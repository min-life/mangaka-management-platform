# Manga Management Platform Backend Refactor Plan

## Objective

Refactor the entire backend to produce a clean, scalable, maintainable architecture that accurately reflects the business domain of the Manga Management Platform.

This is **not** a code cleanup task. It is a complete architecture review and redesign of the backend, including source code, database, APIs, permissions, business workflows and documentation.

The AI is allowed to redesign entities, modules, APIs, DTOs and business logic where necessary to achieve a better architecture. **Backward compatibility is not required** unless explicitly stated.

---

# Scope

The refactor includes:

* Refactor the entire `src` directory.
* Review all modules and dependencies.
* Review all entities and database relationships.
* Review every REST endpoint.
* Complete redesign of the authorization system.
* Add missing business workflows.
* Improve API design.
* Improve DTOs.
* Improve query performance.
* Add activity logging.
* Support notification events.
* Update `workflow.md` to match the final implementation.
* Remove dead code and duplicated logic.

---

# 1. Architecture Refactor

Review every module under `src`.

Expected deliverables:

* Remove duplicated business logic.
* Split oversized services into smaller domain services.
* Standardize module boundaries.
* Extract reusable utilities.
* Standardize DTO naming.
* Standardize repository usage.
* Improve dependency injection.
* Standardize validation.
* Standardize exception handling.
* Remove dead code.
* Improve maintainability.

---

# 2. Database Review

Review every Entity and relationship.

Verify:

* Relationships
* Cascade rules
* Indexes
* Constraints
* Nullable fields
* Enums
* Audit fields
* Soft delete strategy
* Naming consistency

The AI may redesign entities when required by the business workflow.

---

# 3. REST API Review

Every endpoint must be reviewed.

Verify:

* Business logic
* URL structure
* Permission requirements
* Validation
* Request DTO
* Response DTO
* Pagination
* Filtering
* Sorting
* Error handling

Remove redundant endpoints.

Add missing endpoints.

The AI may redesign endpoints if necessary.

Backward compatibility is not required.

---

# 4. Authorization & Permission System

## Objective

Completely redesign the authorization system based on the actual business domain instead of controllers.

Permission evaluation must be centralized.

Business services should never manually check permissions.

Authorization logic should be implemented inside Guards together with dedicated Resource Resolvers.

---

## Permission Model

An endpoint may require:

* one permission
* multiple permissions

Permission evaluation supports:

* ANY
* ALL

Example:

```ts
@RequirePermissions({
    mode: 'ALL',
    permissions: [
        PROJECT_MEMBER_READ,
        TASK_UPDATE
    ]
})

@RequirePermissions({
    mode: 'ANY',
    permissions: [
        PROJECT_OWNER,
        PROJECT_MANAGER
    ]
})
```

---

## Root Resources

The system contains only two root resources.

```
Project

Editor Board
```

Every business resource belongs to exactly one root resource.

---

## Resource Hierarchy

Example:

```
Project
├── Member
├── Folder
├── File
├── Material
├── Task
├── Task Frame
├── Comment
├── Application

Editor Board
├── Member
├── Publish Review
├── Vote
├── Comment
├── Report
```

Every authorization decision must eventually resolve to either a Project or an Editor Board.

---

## Permission Resources

Permissions should be defined using the operated business resource.

Example:

```
PROJECT

PROJECT_MEMBER

FOLDER

FILE

MATERIAL

TASK

TASK_FRAME

TASK_COMMENT

APPLICATION

EDITOR_BOARD

EDITOR_BOARD_MEMBER

VOTE

REPORT
```

The permission resource should describe **what is being operated**, not the URL prefix.

Example:

```
PATCH /projects/:projectId/tasks/:taskId

Permission

TASK_UPDATE
```

not

```
PROJECT_UPDATE
```

because the operation modifies a Task.

---

## Endpoint Design Rules

### Collection Endpoints

Child resources must always be queried through their owning root resource.

Correct:

```
GET /projects/:projectId/tasks

GET /projects/:projectId/folders

GET /projects/:projectId/files

GET /projects/:projectId/materials

GET /editor-boards/:boardId/applications
```

Incorrect:

```
GET /tasks

GET /folders

GET /files

GET /materials
```

Without the root resource the system cannot determine the ownership context.

---

### Direct Resource Access

Resources may expose endpoints by identifier.

Example:

```
GET /tasks/:id

PATCH /tasks/:id

GET /folders/:id

PATCH /folders/:id

GET /files/:id
```

Before evaluating permissions, ownership must be resolved automatically.

Example:

```
Task

↓

File

↓

Folder

↓

Project
```

or

```
Folder

↓

Project
```

---

## Resource Resolvers

Ownership resolution should be isolated inside dedicated Resource Resolvers.

Example:

```
FolderResolver

TaskResolver

FileResolver

MaterialResolver

ApplicationResolver
```

Guards consume these resolvers to determine the owning Project or Editor Board before permission evaluation.

Business services must never perform ownership lookups.

---

## Authorization Flow

Step 1

Resolve ownership.

Example:

```
Task

↓

File

↓

Folder

↓

Project
```

Step 2

Load membership.

Step 3

Load assigned roles.

Step 4

Aggregate permissions.

Step 5

Evaluate ANY / ALL permission requirements.

Step 6

Allow or deny access.

---

## Authorization Goals

The authorization system should provide:

* Resource-based permissions.
* Multiple permissions per endpoint.
* ANY / ALL permission evaluation.
* Automatic ownership resolution.
* Centralized authorization.
* No duplicated permission logic.

---

# 5. Business Workflow

## Authentication

Support:

* Email + Password
* Google OAuth

Registration supports:

* Email verification (optional)
* First login with Google

Both methods produce the same user profile.

---

## Editor Board

Users may create Editor Boards.

Responsibilities:

* Review publish applications.
* Review reports.
* Comment.
* Vote.
* Approve.
* Reject.

Roles:

* Leader
* Member

Only the Leader makes the final decision.

Workflow:

```
Application

↓

Review

↓

Comment

↓

Voting

↓

Leader Decision

↓

Approve / Reject
```

---

## Project

Projects manage the complete manga production lifecycle.

Hierarchy:

```
Project

↓

ARC

↓

Chapter

↓

Page

↓

Material

↓

Task
```

Folder rules:

```
ARC
(parent_id = null)

Chapter
(parent_id = arc_id)
```

Only two folder levels are allowed.

---

## Member Management

Projects support:

* Invite member
* Remove member
* Assign role
* Update permissions

Membership is project-scoped.

---

## File Structure

Each Chapter contains Pages.

Each Page contains:

* Materials
* Tasks

A Page is represented by a File.

---

## Material Versioning

Uploading material is mandatory.

Every upload creates a new version.

Support:

* Latest version
* Version history
* Restore version

Previous versions should never be deleted automatically.

---

## Task Workflow

Each Task:

* Belongs to one File.
* Assigned to exactly one project member.
* Has creator.
* Has updater.
* Has assignee.
* Has deadline.
* Has status.

Support:

* Assign
* Reassign
* Update
* Complete
* Reopen

---

## Subtask Dependency

Tasks support subtasks.

Rule:

```
Parent Task

↓

Subtask A

↓

Subtask B
```

A subtask cannot start until its parent task has been completed.

The backend must validate dependency before changing task status.

---

## Task Comments

Members may comment on:

* Task
* File
* Task Frame

Task Frame allows commenting on a selected region of an image.

Workflow:

```
Image

↓

Selection

↓

Task Frame

↓

Comments
```

---

## Project Applications

Projects may submit:

* Draft Submission
* Publish Request

Workflow:

```
Project

↓

Internal Review

↓

Internal Approval

↓

Submit to Editor Board

↓

Editor Board Review

↓

Approve / Reject
```

Internal approval is required before submission.

---

## Activity Log

Every significant operation must generate an Activity Log.

Examples:

* Member invited
* Member removed
* Task assigned
* Task completed
* Deadline changed
* Status updated
* Folder created
* Folder moved
* Material uploaded
* Application submitted
* Application approved
* Application rejected
* Comment created

Activity Logs support:

* Notifications
* Activity Timeline
* Audit History

---

# 6. API Design Guidelines

## Shallow Responses

Responses should never embed deep object graphs.

Good:

```
Task

File (basic)

CreatedBy (basic)

UpdatedBy (basic)

AssignedBy (basic)
```

Bad:

```
Task

↓

File

↓

Folder

↓

Project

↓

Members

↓

Roles
```

Clients should retrieve additional resources using dedicated endpoints.

---

## Summary Fields

Collection APIs should expose summary statistics.

Project

```
memberCount

arcCount

chapterCount

pageCount

taskCount

completedTaskCount
```

ARC

```
chapterCount

pageCount
```

Chapter

```
pageCount

taskCount
```

Page

```
taskCount

materialCount

latestVersion
```

Editor Board

```
memberCount

pendingApplicationCount
```

Application

```
reviewCount

voteCount

commentCount
```

Avoid returning large collections when summary values are sufficient.

---

## Endpoint Review Rules

Every endpoint should satisfy:

* URL follows the resource hierarchy.
* Permission resource matches the operated resource.
* Request DTO is consistent.
* Response DTO is shallow.
* Business logic belongs to the correct service.
* Pagination is supported where appropriate.
* Filtering and sorting are consistent.

---

# 7. workflow.md Requirements

Rewrite `workflow.md` after completing the refactor.

The documentation must reflect the implemented code rather than preserving the existing document.

Every workflow should include:

* Actors
* Trigger
* Preconditions
* Input
* Output
* Permissions
* State transitions
* Notifications
* Activity logs

The document should cover:

* Authentication
* Authorization
* Project
* Editor Board
* Folder
* File
* Material Version
* Task
* Subtask
* Comments
* Applications
* Internal Approval
* Publish Approval
* Notification
* Activity Logging

---

# 8. Refactor Checklist

## Architecture

* Review module boundaries.
* Remove duplicated logic.
* Improve service separation.
* Standardize naming.
* Remove dead code.

## Database

* Review entities.
* Review relationships.
* Add missing constraints.
* Add missing indexes.

## APIs

* Review every endpoint.
* Remove redundant APIs.
* Add missing APIs.
* Standardize DTOs.
* Standardize pagination.

## Authorization

* Resource-based permissions.
* Root resource ownership resolution.
* Resource resolvers.
* ANY / ALL permission evaluation.
* Centralized authorization.

## Business

* Authentication
* Editor Board
* Project
* Folder
* File
* Material
* Task
* Task Frame
* Comment
* Application
* Approval
* Activity Log
* Notification

## Documentation

Regenerate `workflow.md` to ensure all modules, permissions, workflows, API contracts and state transitions accurately reflect the final implementation.
