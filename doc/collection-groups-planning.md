# Collection Groups Feature - Development Plan

## Executive Summary

This document outlines the development plan for implementing Collection Groups functionality in the Sources app. The feature will allow collections to be organized into groups with access control lists (ACL), enabling admins to protect important collections from unauthorized edits while allowing designated users to create and edit collections within specific groups.

**Timeline**: 3-4 weeks with 3 developers  
**Team Size**: 3 developers  
**Estimated Effort**: ~15-18 developer-weeks total

---

## Background & Context

### Current State
- **Collections**: Exist as standalone entities with fields: name, notes, platform, public, featured, managed
- **Sources**: Have a ManyToMany relationship with Collections
- **Permissions**: Currently use Django groups (CONTRIBUTOR) and staff/admin checks via `IsGetOrIsStaffOrContributor` permission class
- **Architecture**: Django REST Framework backend with React frontend (Material-UI)

### Requirements
1. Collections belong to Collection Groups (new model)
2. Collection Groups have ACL - admins can add users to groups
3. Users in a group can create/edit collections within that group
4. Sources maintain separate ACL (existing functionality)
5. UI for creating and managing collection groups
6. UI for assigning collections to groups
7. UI for managing group membership

### Out of Scope (Future Work)
- Search interface enhancements to find collections by groups
- Bulk operations on collection groups
- Group-level analytics or reporting

---

## Technical Design

### Database Schema Changes

#### New Model: `CollectionGroup`
```python
class CollectionGroup(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['name']),
        ]
```

#### Updated Model: `Collection`
Add foreign key to CollectionGroup:
```python
collection_group = models.ForeignKey(
    CollectionGroup, 
    on_delete=models.SET_NULL, 
    null=True, 
    blank=True,
    related_name='collections'
)
```

#### New Model: `CollectionGroupMember`
ManyToMany relationship between Users and CollectionGroups:
```python
class CollectionGroupMember(models.Model):
    collection_group = models.ForeignKey(CollectionGroup, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='group_members_added')
    
    class Meta:
        unique_together = [['collection_group', 'user']]
        indexes = [
            models.Index(fields=['collection_group', 'user']),
        ]
```

### Permission Model

**Collection Group Permissions:**
- **View**: All authenticated users can view groups and their collections (if public)
- **Create Group**: Staff/admin only
- **Edit Group**: Staff/admin only
- **Delete Group**: Staff/admin only
- **Manage Members**: Staff/admin only
- **Create Collection in Group**: Staff/admin OR user is a member of the group
- **Edit Collection in Group**: Staff/admin OR user is a member of the group
- **Delete Collection**: Staff/admin only (unchanged)

**Collection Permissions (Updated):**
- Collections without a group: Existing permissions apply (staff/contributor)
- Collections with a group: User must be staff/admin OR member of the collection's group

### API Endpoints

#### Collection Groups
- `GET /api/collection-groups/` - List all groups (with member count)
- `GET /api/collection-groups/{id}/` - Get group details
- `POST /api/collection-groups/` - Create group (staff only)
- `PATCH /api/collection-groups/{id}/` - Update group (staff only)
- `DELETE /api/collection-groups/{id}/` - Delete group (staff only)

#### Collection Group Members
- `GET /api/collection-groups/{id}/members/` - List members of a group
- `POST /api/collection-groups/{id}/members/` - Add user to group (staff only)
- `DELETE /api/collection-groups/{id}/members/{user_id}/` - Remove user from group (staff only)

#### Collections (Updated)
- `GET /api/collections/` - Add optional `collection_group_id` filter
- `PATCH /api/collections/{id}/` - Update collection (check group membership)
- `POST /api/collections/` - Create collection (check group membership if group specified)

---

## Development Tasks

### Phase 1: Backend Foundation (Week 1)
**Developer 1: Database & Models**

1. **Create CollectionGroup model** (4 hours)
   - Model definition with fields
   - Admin registration
   - Migration file

2. **Update Collection model** (3 hours)
   - Add `collection_group` ForeignKey field
   - Update indexes if needed
   - Migration file

3. **Create CollectionGroupMember model** (4 hours)
   - Model definition
   - Unique constraint on (group, user)
   - Migration file

4. **Run and test migrations** (2 hours)
   - Test on development database
   - Verify foreign key constraints
   - Test data migration if needed for existing collections

**Developer 2: Serializers & Permissions**

5. **Create CollectionGroup serializers** (4 hours)
   - `CollectionGroupSerializer` (read)
   - `CollectionGroupWriteSerializer` (write)
   - Include member count annotation

6. **Create CollectionGroupMember serializer** (3 hours)
   - Serializer with user details
   - Validation logic

7. **Update Collection serializer** (3 hours)
   - Add `collection_group` field
   - Add `collection_group_name` for display

8. **Create CollectionGroupPermission class** (5 hours)
   - Permission logic for group operations
   - Permission logic for collection operations within groups
   - Update `IsGetOrIsStaffOrContributor` or create new permission class

**Developer 3: API Views & Endpoints**

9. **Create CollectionGroupViewSet** (6 hours)
   - CRUD operations
   - Member count annotation
   - Permission checks

10. **Create CollectionGroupMemberViewSet** (5 hours)
    - List/add/remove members
    - Permission checks (staff only)

11. **Update CollectionViewSet** (4 hours)
    - Add `collection_group_id` filter
    - Update permission checks for create/update
    - Ensure backward compatibility

12. **Update URL routing** (1 hour)
    - Register new viewsets
    - Test endpoints

### Phase 2: Backend Testing & Refinement (Week 2)
**All Developers: Testing & Bug Fixes**

13. **Write unit tests for models** (4 hours - Developer 1)
    - CollectionGroup model tests
    - CollectionGroupMember model tests
    - Collection model updates tests

14. **Write API tests** (8 hours - Developer 2)
    - CollectionGroup endpoints
    - CollectionGroupMember endpoints
    - Updated Collection endpoints with permissions

15. **Integration testing** (6 hours - Developer 3)
    - Test permission scenarios
    - Test edge cases (deleting groups, moving collections)
    - Test backward compatibility

16. **Bug fixes and refinements** (6 hours - All)
    - Address issues found in testing
    - Performance optimization if needed
    - Code review

### Phase 3: Frontend Development (Week 2-3)
**Developer 1: API Integration & State Management**

17. **Create RTK Query API slices** (4 hours)
    - `collectionGroupsApi` slice
    - `collectionGroupMembersApi` slice
    - Update `collectionsApi` slice

18. **Update Redux state management** (3 hours)
    - Update collections slice if needed
    - Add collection groups to state

**Developer 2: Collection Group Management UI**

19. **Create CollectionGroupList component** (5 hours)
    - List all groups with member counts
    - Link to group details
    - Admin actions (create/edit/delete)

20. **Create CollectionGroupForm component** (4 hours)
    - Create/edit group form
    - Validation
    - Error handling

21. **Create CollectionGroupDetail component** (6 hours)
    - Display group information
    - List collections in group
    - Member management section

22. **Create CollectionGroupMemberManagement component** (5 hours)
    - Add/remove members interface
    - User search/selection
    - Member list display

**Developer 3: Collection UI Updates**

23. **Update CreateCollection component** (4 hours)
    - Add collection group selector
    - Permission checks
    - Validation

24. **Update ModifyCollection component** (4 hours)
    - Add collection group selector
    - Permission checks
    - Display current group

25. **Update CollectionList component** (3 hours)
    - Display group information
    - Filter by group (if needed)

26. **Update CollectionShow component** (3 hours)
    - Display group information
    - Show group membership status

### Phase 4: Frontend Testing & Polish (Week 3)
**All Developers: Testing & Refinement**

27. **Frontend unit tests** (6 hours - Developer 1)
    - Test API slices
    - Test utility functions

28. **Component testing** (8 hours - Developer 2)
    - Test all new components
    - Test permission-based UI rendering

29. **End-to-end testing** (6 hours - Developer 3)
    - Test complete user flows
    - Test permission scenarios
    - Cross-browser testing

30. **UI/UX polish** (4 hours - All)
    - Styling consistency
    - Error message improvements
    - Loading states
    - Accessibility improvements

### Phase 5: Documentation & Deployment Prep (Week 4)
**All Developers: Finalization**

31. **Update API documentation** (3 hours - Developer 1)
    - Document new endpoints
    - Update existing endpoint docs

32. **User documentation** (4 hours - Developer 2)
    - Admin guide for managing groups
    - User guide for working with groups

33. **Migration planning** (3 hours - Developer 3)
    - Production migration strategy
    - Data migration for existing collections (if needed)
    - Rollback plan

34. **Final code review** (4 hours - All)
    - Security review
    - Performance review
    - Code quality review

35. **Deployment preparation** (2 hours - Developer 1)
    - Update deployment scripts if needed
    - Environment variable updates
    - Database backup procedures

---

## Time Estimates Summary

### By Phase
- **Phase 1 (Backend Foundation)**: ~40 hours (1.3 weeks with 3 devs)
- **Phase 2 (Backend Testing)**: ~24 hours (0.8 weeks with 3 devs)
- **Phase 3 (Frontend Development)**: ~38 hours (1.3 weeks with 3 devs)
- **Phase 4 (Frontend Testing)**: ~24 hours (0.8 weeks with 3 devs)
- **Phase 5 (Documentation & Deployment)**: ~16 hours (0.5 weeks with 3 devs)

**Total**: ~142 hours = ~4.7 developer-weeks = **~1.6 calendar weeks with 3 developers working in parallel**

### By Developer Role
- **Developer 1 (Backend/Models)**: ~45 hours
- **Developer 2 (Backend/API)**: ~50 hours
- **Developer 3 (Frontend)**: ~47 hours

### Contingency
Add 20% buffer for unexpected issues: **~170 hours total = ~5.6 developer-weeks = ~2 calendar weeks**

**Realistic Timeline: 3-4 weeks** (accounting for meetings, code reviews, and other overhead)

---

## Risk Assessment & Mitigation

### High Risk
1. **Permission complexity**: Ensuring correct permissions across all scenarios
   - *Mitigation*: Comprehensive test coverage, code review focus on permission logic

2. **Data migration**: Existing collections need to be handled
   - *Mitigation*: Create migration script to set all existing collections to null group, test thoroughly

3. **Backward compatibility**: Existing API consumers may break
   - *Mitigation*: Make `collection_group` optional, maintain existing behavior for collections without groups

### Medium Risk
1. **Performance**: Additional queries for permission checks
   - *Mitigation*: Use select_related/prefetch_related, add database indexes, monitor query performance

2. **UI complexity**: Managing groups adds cognitive load
   - *Mitigation*: User testing, clear UI/UX, good documentation

### Low Risk
1. **Frontend state management**: RTK Query should handle this well
2. **Database schema**: Straightforward additions

---

## Success Criteria

### Functional Requirements
- ✅ Collections can be assigned to collection groups
- ✅ Admins can create/edit/delete collection groups
- ✅ Admins can add/remove users from groups
- ✅ Users in a group can create/edit collections in that group
- ✅ Users cannot edit collections in groups they're not members of
- ✅ All existing functionality continues to work

### Non-Functional Requirements
- ✅ All tests pass
- ✅ API response times < 200ms for list endpoints
- ✅ No breaking changes to existing API
- ✅ Code coverage > 80% for new code
- ✅ Documentation complete

### User Acceptance
- ✅ Admins can successfully manage groups and members
- ✅ Group members can successfully create/edit collections
- ✅ Non-members cannot edit protected collections
- ✅ UI is intuitive and matches existing design patterns

---

## Dependencies

### External
- None identified

### Internal
- Django REST Framework (existing)
- React/Redux Toolkit Query (existing)
- Material-UI (existing)
- Existing permission infrastructure

---

## Open Questions

1. **Default behavior for existing collections**: Should they be assigned to a default group or remain ungrouped?
   - *Recommendation*: Leave ungrouped (null), maintain existing permissions

2. **Group deletion**: What happens to collections when a group is deleted?
   - *Recommendation*: Set collection_group to null (SET_NULL), maintain collections

3. **Multiple group membership**: Can a user be in multiple groups?
   - *Recommendation*: Yes, users can be members of multiple groups

4. **Group visibility**: Should groups be visible to all users or only to members/admins?
   - *Recommendation*: Visible to all authenticated users, but membership details only to admins

5. **Collection movement**: Can collections be moved between groups?
   - *Recommendation*: Yes, by admins or group members of both source and target groups

---

## Next Steps

1. **Review and approve this plan** with stakeholders
2. **Assign developers** to specific tasks
3. **Set up development branches** and project board
4. **Schedule kickoff meeting** to align on approach
5. **Begin Phase 1** development

---

## Appendix: File Changes Summary

### New Files
- `mcweb/backend/sources/models.py` - Add CollectionGroup, CollectionGroupMember models
- `mcweb/backend/sources/serializer.py` - Add CollectionGroup serializers
- `mcweb/backend/sources/api.py` - Add CollectionGroupViewSet, CollectionGroupMemberViewSet
- `mcweb/backend/sources/permissions.py` - Add CollectionGroupPermission class
- `mcweb/frontend/src/features/collection-groups/` - New directory with all group management components
- `mcweb/frontend/src/app/services/collectionGroupsApi.js` - RTK Query API slice
- Migration files for new models

### Modified Files
- `mcweb/backend/sources/models.py` - Update Collection model
- `mcweb/backend/sources/serializer.py` - Update CollectionSerializer
- `mcweb/backend/sources/api.py` - Update CollectionViewSet
- `mcweb/backend/sources/urls.py` - Add new routes
- `mcweb/frontend/src/features/collections/*.jsx` - Update collection components
- `mcweb/frontend/src/app/services/collectionsApi.js` - Update API slice

---

*Document Version: 1.0*  
*Last Updated: [Current Date]*  
*Author: Product Management*



