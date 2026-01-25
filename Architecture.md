# Architecture Documentation

## Overview

The United Education Scraper follows a clean, object-oriented architecture with clear separation of concerns.

## Class Hierarchy

```
BrowserManager (Abstract Base Class)
    ↓
AuthenticationService
    ↓
UnitedEducationScraper (Main Orchestrator)
    ↓
ProgramSearchService (Composition)
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Application                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              UnitedEducationScraper                          │
│  • Orchestrates all operations                               │
│  • Public API for users                                      │
│  • Manages service lifecycle                                 │
└────────────┬───────────────────────────┬────────────────────┘
             │                           │
             ↓                           ↓
┌────────────────────────┐   ┌──────────────────────────────┐
│  AuthenticationService │   │  ProgramSearchService        │
│  • Login management    │   │  • Data scraping             │
│  • Session handling    │   │  • Filter management         │
│  • Cookie management   │   │  • Pagination handling       │
└────────┬───────────────┘   └──────────────────────────────┘
         │
         ↓
┌────────────────────────┐
│    BrowserManager      │
│  • Browser lifecycle   │
│  • Page navigation     │
│  • Error handling      │
│  • Screenshot capture  │
└────────┬───────────────┘
         │
         ↓
┌────────────────────────┐
│     Puppeteer          │
│  • Browser automation  │
└────────────────────────┘
```

## Component Responsibilities

### BrowserManager (Base Class)

- **Purpose**: Manage browser lifecycle and common operations
- **Responsibilities**:
  - Initialize Puppeteer browser
  - Configure viewport and user agent
  - Provide navigation utilities
  - Handle screenshots and cookies
  - Manage page instances
- **Pattern**: Abstract base class providing common functionality

### AuthenticationService

- **Purpose**: Handle user authentication
- **Responsibilities**:
  - Navigate to login page
  - Fill credentials
  - Submit login form
  - Verify login success
  - Manage authentication state
- **Pattern**: Extends BrowserManager, adds authentication logic

### ProgramSearchService

- **Purpose**: Scrape program data
- **Responsibilities**:
  - Navigate to program search
  - Select academic terms
  - Apply filters
  - Handle pagination
  - Extract program data
  - Manage search state
- **Pattern**: Composition - receives Page instance from AuthenticationService

### UnitedEducationScraper (Orchestrator)

- **Purpose**: Main public interface
- **Responsibilities**:
  - Coordinate authentication and scraping
  - Provide simple API for users
  - Manage service instances
  - Handle high-level workflows
- **Pattern**: Facade pattern - simplifies complex subsystem

## Data Flow

```
User Request
    ↓
UnitedEducationScraper.scrapePrograms()
    ↓
1. AuthenticationService.login()
    ↓
2. ProgramSearchService.navigateToProgramSearch()
    ↓
3. ProgramSearchService.selectTerm()
    ↓
4. ProgramSearchService.applyFilters() [if filters provided]
    ↓
5. ProgramSearchService.getPaginationInfo()
    ↓
6. For each page:
    ↓
   ProgramSearchService.scrapeCurrentPage()
    ↓
7. Aggregate results
    ↓
Return ScrapeResult to user
```

## Design Patterns Used

### 1. Template Method Pattern (BrowserManager)

Base class defines common browser operations, subclasses implement specific behavior.

### 2. Facade Pattern (UnitedEducationScraper)

Provides simplified interface to complex subsystem of services.

### 3. Composition over Inheritance

ProgramSearchService uses composition (receives Page) rather than extending BrowserManager.

### 4. Dependency Injection

Services receive dependencies through constructor (Page, credentials).

### 5. Single Responsibility Principle

Each class has one clear responsibility.

### 6. Error Handling Strategy

Custom error types with context for better debugging.

## Error Handling Flow

```
User Operation
    ↓
Try Block
    ↓
Service Method
    ↓
[Error Occurs]
    ↓
Catch in Service
    ↓
Wrap in ScraperError with context
    ↓
Throw to caller
    ↓
User handles with try-catch
    ↓
Finally: cleanup (close browser)
```

## Type System

```
Core Types (types/index.ts)
    ↓
    ├─ BrowserConfig
    ├─ LoginCredentials
    ├─ LoginOptions
    ├─ Program
    ├─ FilterFields
    ├─ ProgramSearchOptions
    ├─ PaginationInfo
    ├─ ScrapeResult
    └─ ScraperError / ScraperErrorType
```

## Extension Points

### Adding New Scrapers

1. Create new service class
2. Either extend BrowserManager or use composition
3. Add to UnitedEducationScraper as needed

### Adding New Features

1. Add to appropriate service class
2. Expose through UnitedEducationScraper if public API
3. Update types if needed

### Custom Error Handling

1. Add new ScraperErrorType
2. Throw ScraperError with new type
3. Handle specifically in user code

## Best Practices

1. **Always use try-finally**: Ensure browser cleanup
2. **Check authentication**: Use `isLoggedIn()` before scraping
3. **Handle errors gracefully**: Catch specific error types
4. **Use type safety**: Leverage TypeScript interfaces
5. **Resource management**: Always call `close()` method
6. **Respect rate limits**: Add delays between operations
7. **Session persistence**: Save cookies for repeated use
8. **Error screenshots**: Enable for debugging

## Testing Strategy

```
Unit Tests
    ├─ BrowserManager initialization
    ├─ AuthenticationService login flow
    ├─ ProgramSearchService data extraction
    └─ Error handling

Integration Tests
    ├─ Full scraping workflow
    ├─ Filter application
    ├─ Pagination handling
    └─ Session persistence

End-to-End Tests
    └─ Complete user scenarios
```

## Performance Considerations

1. **Headless mode**: Faster execution
2. **Parallel scraping**: Multiple instances (with caution)
3. **Selective scraping**: Use filters to reduce data volume
4. **Pagination**: Process pages incrementally
5. **Resource cleanup**: Prevent memory leaks
6. **Cookie reuse**: Avoid repeated logins

## Security Considerations

1. **Credential storage**: Use environment variables
2. **Cookie security**: Protect session data
3. **HTTPS only**: Ensure secure connections
4. **Rate limiting**: Prevent abuse
5. **Error logging**: Don't log sensitive data
