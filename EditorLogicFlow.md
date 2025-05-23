# Quiz Editor Logic Flow Documentation

This document outlines how key properties affect routing and editor behavior in the quiz system.

## Key Properties

### 1. `status` Property

#### Routing Effects
- Determines which editor view to show
- New items start as `'draft'`
- Existing items preserve their status
- Controls access to edit functionality

#### Editor Behavior
- Controls save/submit button visibility
- Determines validation requirements
- Affects UI feedback and messaging

### 2. `beta` Property

#### Routing Effects
- Affects quiz set visibility
- Controls access to beta features
- May restrict certain routes or views

#### Editor Behavior
- Shows additional UI elements for beta testing
- May enable experimental features
- Provides beta-specific feedback

### 3. `inProgress` Property

#### Routing Effects
- Determines quiz set visibility
- Separates published from proposed sets
- Affects navigation between views

#### Editor Behavior
- Shows special UI components for in-progress items
- Displays progress indicators
- Affects tab navigation and organization

### 4. `revisionNumber` and `version` Properties

#### Routing Effects
- Determines which version to load
- Controls version history access
- Affects navigation between versions

#### Editor Behavior
- Controls version history display
- Manages save behavior and versioning
- Tracks changes and maintains history

### 5. `isPermanent` Property

#### Routing Effects
- Determines if item can be edited directly
- Controls creation of draft copies
- Affects navigation between original and copies

#### Editor Behavior
- Controls edit permissions
- Affects save behavior
- Manages relationship between original and modified versions

## Key Interactions

### 1. Version Control Flow
- `version` and `revisionNumber` work together to track changes
- `isPermanent` determines if changes create new versions or modify existing ones
- Version history is maintained for all changes

### 2. Quiz Set Organization
- `inProgress` and `beta` work together to organize quiz sets
- `status` determines visibility and editability
- Sets can be filtered based on these properties

### 3. Editor Access Control
- `isPermanent` and `status` combine to control edit permissions
- `version` tracks changes and maintains history
- Access control is enforced at multiple levels

## Implementation Notes

1. New items always start with:
   ```javascript
   {
     status: 'draft',
     version: 1,
     isPermanent: false
   }
   ```

2. Version tracking:
   ```javascript
   if (existingVersion) {
     newVersion = existingVersion + 1;
   } else {
     newVersion = 1;
   }
   ```

3. Quiz set filtering:
   ```javascript
   const publishedQuizSets = quizSets.filter(set => !set.inProgress);
   const proposedQuizSets = quizSets.filter(set => set.inProgress);
   ```

4. Edit permissions:
   ```javascript
   if (item.isPermanent) {
     // Create a copy for editing
     const itemCopy = {
       ...item,
       originalId: itemId,
       isDraft: true
     };
   }
   ```

## State Transitions

1. **New Item Creation**:
   - `status`: 'draft'
   - `version`: 1
   - `isPermanent`: false

2. **Submitting for Review**:
   - `status`: 'pending'
   - `version`: preserved
   - `isPermanent`: false

3. **Approval**:
   - `status`: 'approved'
   - `version`: preserved
   - `isPermanent`: true

4. **Rejection**:
   - `status`: 'rejected'
   - `version`: preserved
   - `isPermanent`: false

5. **Deletion**:
   - `status`: 'deleted'
   - `version`: preserved
   - `isPermanent`: preserved

## Control Flow Diagrams

### 1. Quiz Item Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Pending: Submit for Review
    Pending --> Approved: Admin Approval
    Pending --> Rejected: Admin Rejection
    Approved --> Draft: Create New Version
    Rejected --> Draft: Edit and Resubmit
    Draft --> [*]: Delete
    Pending --> [*]: Delete
    Approved --> [*]: Delete
    Rejected --> [*]: Delete
```

### 2. Version Control Flow

```mermaid
flowchart TD
    A[New Item] -->|Create| B[Version 1]
    B -->|Edit| C{Is Permanent?}
    C -->|Yes| D[Create Copy]
    C -->|No| E[Edit Directly]
    D -->|Save| F[New Version]
    E -->|Save| F
    F -->|Submit| G[Pending Review]
    G -->|Approve| H[Approved Version]
    G -->|Reject| I[Rejected Version]
    H -->|Edit| D
    I -->|Edit| D
```

### 3. Quiz Set Organization

```mermaid
flowchart LR
    A[Quiz Sets] --> B{In Progress?}
    B -->|Yes| C[Proposed Sets]
    B -->|No| D[Published Sets]
    C --> E{Beta?}
    D --> F[Available to All]
    E -->|Yes| G[Beta Features]
    E -->|No| H[Standard Features]
```

### 4. Editor Access Control

```mermaid
flowchart TD
    A[Access Request] --> B{Is Permanent?}
    B -->|Yes| C{Has Edit Rights?}
    B -->|No| D[Direct Edit]
    C -->|Yes| E[Create Copy]
    C -->|No| F[View Only]
    D --> G[Save Changes]
    E --> G
    G --> H{Valid?}
    H -->|Yes| I[Update Version]
    H -->|No| J[Show Errors]
```

### 5. State Transition Matrix

```mermaid
stateDiagram-v2
    [*] --> Draft: Create
    Draft --> Pending: Submit
    Pending --> Approved: Admin OK
    Pending --> Rejected: Admin No
    Approved --> Draft: New Version
    Rejected --> Draft: Edit
    state Draft {
        [*] --> Editing
        Editing --> Saving
        Saving --> [*]
    }
    state Pending {
        [*] --> Review
        Review --> Decision
        Decision --> [*]
    }
    state Approved {
        [*] --> Published
        Published --> Archived
        Archived --> [*]
    }
```

### 6. Forking Mechanism

```mermaid
flowchart TD
    A[Original Item] --> B{Is Permanent?}
    B -->|Yes| C[Create Fork]
    B -->|No| D[Direct Edit]
    C --> E[New Draft]
    E --> F[Edit Fork]
    F --> G[Save Changes]
    G --> H[Submit Fork]
    H --> I[Review Fork]
    I -->|Approve| J[Merge Changes]
    I -->|Reject| K[Discard Fork]
    J --> L[Update Original]
    K --> M[Return to Original]
```

The forking mechanism allows users to:
1. Create a copy of a permanent item
2. Make changes without affecting the original
3. Submit changes for review
4. Merge approved changes back to the original

This is particularly important for:
- Collaborative editing
- Version control
- Change tracking
- Quality assurance

These diagrams illustrate:
1. The complete lifecycle of a quiz item
2. How version control works with permanent items
3. How quiz sets are organized and filtered
4. The access control flow for editing
5. Detailed state transitions for each major state

The diagrams use standard flowchart and state diagram notation to show:
- Decision points (diamonds)
- Processes (rectangles)
- States (rounded rectangles)
- Transitions (arrows)
- Start/End points (circles)

## Security Concerns and Recommendations

### Identified Security Issues

1. **Version Control Race Conditions**
   - Multiple users could create conflicting versions
   - No explicit handling of concurrent edits
   - Potential for version number conflicts

2. **Access Control Gaps**
   - Direct edit path lacks explicit permission checks
   - No validation of user roles for certain operations
   - Potential for unauthorized modifications

3. **State Transition Vulnerabilities**
   - No validation of state transitions
   - Could allow skipping of required states
   - Potential for unauthorized state changes

4. **Missing Validation Points**
   - Incomplete validation checks
   - No explicit security validation
   - Could miss critical security checks

5. **Quiz Set Organization Risks**
   - No explicit handling of set ownership
   - Missing permission checks for set modifications
   - Potential for unauthorized set changes

6. **Version History Vulnerabilities**
   - No protection against version history tampering
   - Missing version number validation
   - Could allow version manipulation

7. **Missing Error States**
   - No explicit error handling
   - Missing rollback mechanisms
   - Could leave system in inconsistent state

8. **Data Integrity Concerns**
   - Incomplete data validation
   - No corruption checks
   - Could allow invalid data entry

9. **Audit Trail Gaps**
   - Missing state change logging
   - No user action tracking
   - Difficult to track malicious activity

10. **Resource Management**
    - No resource limit handling
    - Missing rate limiting
    - Potential for resource exhaustion

### Recommended Solutions

#### 1. Enhanced Validation Layer

```mermaid
flowchart TD
    A[Access Request] --> B{Is Permanent?}
    B -->|Yes| C{Has Edit Rights?}
    B -->|No| D{Has User Permissions?}
    D -->|Yes| E[Direct Edit]
    D -->|No| F[Access Denied]
```

#### 2. State Transition Guards

```mermaid
stateDiagram-v2
    [*] --> Draft: Create
    Draft --> Pending: Submit + Validate
    Pending --> Approved: Admin OK + Validate
    Pending --> Rejected: Admin No + Validate
```

#### 3. Version Control Safeguards

```mermaid
flowchart TD
    A[Edit Request] --> B{Check Version}
    B -->|Current| C[Proceed]
    B -->|Outdated| D[Fetch Latest]
    D --> E{Has Conflicts?}
    E -->|Yes| F[Resolve Conflicts]
    E -->|No| C
```

#### 4. Error Handling

```mermaid
flowchart TD
    A[Operation] --> B{Validate}
    B -->|Success| C[Proceed]
    B -->|Failure| D[Log Error]
    D --> E[Rollback]
    E --> F[Notify User]
```

#### 5. Audit Trail

```mermaid
flowchart TD
    A[State Change] --> B[Log Change]
    B --> C[Validate Log]
    C --> D[Store Log]
    D --> E[Notify Admin]
```

### Implementation Recommendations

1. **Add Validation Checks**
   - Implement comprehensive input validation
   - Add role-based access control
   - Validate all state transitions

2. **Enhance Error Handling**
   - Implement proper error logging
   - Add rollback mechanisms
   - Create error recovery procedures

3. **Improve Version Control**
   - Add version conflict detection
   - Implement version locking
   - Add version history validation

4. **Strengthen Access Control**
   - Implement proper permission checks
   - Add role validation
   - Create access control lists

5. **Add Monitoring**
   - Implement audit logging
   - Add activity monitoring
   - Create alert systems

6. **Resource Protection**
   - Implement rate limiting
   - Add resource quotas
   - Create usage monitoring

7. **Data Protection**
   - Add data validation
   - Implement corruption checks
   - Create backup systems

8. **State Management**
   - Add state transition validation
   - Implement state recovery
   - Create state monitoring

These recommendations should be implemented to ensure:
- System security
- Data integrity
- Proper access control
- Audit capability
- Error recovery
- Resource protection 