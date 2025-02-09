# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

[//]: # (## Unreleased)

## 1.5.0 - 2025-01-27

### Added
- `PetriNetRegionSynthesiser` now accepts an optional configuration object as a parameter to the `synthesise()` method
  - the object is of the new type `SynthesisConfiguration`, its optional attribute `noShortLoops` controls whether the Synthesiser generates models without short-loops
- `DanglingPlaceRemoverService` is a new service that can be used to remove "dangling" places from a Petri net
  - a place is "dangling" if it has no outgoing arcs, and it is not the only place in the post-set of all the transitions in its pre-set
- Implementing custom file upload functionality
  - `FileUploadOverlayComponent` is a new component that simplifies the implementation of custom file upload drag-and-drop functionality
    - it displays its contents
    - when a drag event is detected in the windows, it overlays its contents with a transparent border and an information signaling to the user that it accepts a drag-and-dropped file
    - when a file is dropped, it emits an `@output` event, just like the existing `FileUploadComponent`
  - `AbstractFileUploadComponent` is a new abstract component class, that factors out common functionality of the existing `FileUploadComponent` and the new `FileUploadOverlayComponent`
- JSON Petri net support
  - `JsonPetriNetConverterService` converts a `PetriNet` instance into a plain object with a structure conforming to the existing `JsonPetriNet` interface.
  - `JsonPetriNetSerialisationService` serialises a `PetriNet` instance into a JSON string
- a static `implyInitialMarking()` method was added to the `PetriNet` class
  - if the provided net is not marked, and it contains no transitions with an empty pre-set, it marks all the places with an empty pre-set with a single token
- better logging control for `IlpSolver` and its subclasses
  - the configuration property `logEquations` (off by default) can be used to log each equation added to the ILP in a human-readable format
  - the configuration property `logEachRegion` (off by default) can be used to log the solution of the ILP when a region is found
- `NoopMultisetEquivalent` implementation of the abstract `MultisetEquivalent` with a no-operation `merge` method implementation

### Changed
- changed how the configuration object is passed to `IlpSolver` and some of its subclasses
  - the configuration object is now passed via the constructor instead of as an argument to some method calls
  - affects:
    - `IlpSolver`
    - `TokenTrailIlpSolver`
    - `PetriNetRegionIlpSolver`
- `PetriNetRegion` interface changed
  - the attribute `rises` is no longer a map of transition labels to rise values, instead, it maps labels to an object containing the minimum inflow and outflow of each label
  - the previous value can be calculated as `outflow - inflow`
- the configuration object of the `synthesise()` method of the `PetriNetRegionSynthesisService` has been extended with the new `SynthesisConfiguration`
- `PetriNetSerialisationService` can now serialise a `PetriNet` instance into both a JSON and the legacy `.pn' string
  - `serialise()` now takes a second argument of type `PnOutputFileFormat`, specifying the desired output format
    - calling `serialise()` with a single argument produces the legacy `.pn` string
  - the original service can be used directly via the new `PlainPetriNetSerialisationService`
- margin of the title in the `PageLayoutComponent` adjusted to provide more forgiving click-boxes ner the top of the page
- renamed the `addToMultiset` method of the `Multiset` class to `incrementMultisetMultiplicity` to match its implementation (functionality unchanged)
- bumped dependency version of `glpk.js` from `4.0.1` to `4.0.2`

### Fixed
- type signature of the `MultisetMap` class was updated from `MultisetMap<T>` to `MultisetMap<T extends MultisetEquivalent>` to better match the reality
  - should be backwards compatible, as all methods of the class required the type-parameter `T` to extend `MultisetEquivalent` already 

## 1.4.0 - 2024-02-20
### Added
- `PetriNetParserService` now supports parsing from:
  - .xml files in Petri Net Markup Language (PNML) format
  - .json files in the format supported by Modules developed in FaPra WiSe 23/24
  - the original (now legacy) plain text files used by the older ILPN modules
- The Footer Component now has an optional `[sourceLink]` input. The provided URL string is displayed in the footer next to a GitHub SVG icon as a link to the module source code

### Changed
- `TokenTrailIlpSolver` now allows the zero vector as a valid solution
- `PetriNetRegionIlpSolver` now requires a non-zero vector solution in addition to the constraints of the `TokenTrailIlpSolver` super class

### Fixed
- calling `getLabelCount()` on a Petri net object after changing the labelling of its transitions now returns the new label count

## 1.3.0 - 2023-12-19
### Added
- Displaying a Petri net
  - An abstract `PetriNetLayoutManagerFactoryService` is now injected by the `PnDisplayComponent`
    - Multiple implementations of graph layout algorithms are now supported
    - Currently, these implementations are provided in root as factory services and you can select which should be applied by a custom providers entry
      - Example: `{provide: PetriNetLayoutManagerFactoryService, useExisting: SugiyamaLayoutManagerFactoryService}`
  - `SugiyamaLayoutManagerFactoryService` creates a manager for the Sugiyama layout
    - This is the algorithm available in previous version of this library and remains unchanged otherwise
  - `SpringEmbedderLayoutManagerFactoryService` creates a manager for the spring embedder layout
    - Used as the default layout manager factory if none is set
    - Nodes repel each other, arcs act as springs and pull connected nodes closer together, the graph settles at an equilibrium
    - Nodes can be dragged using the mouse and the rest of the graph will react to the dragging and change its layout
    - A new net can replace an old net and inherit the positions of all the nodes they have in common
- `DescriptiveLinkComponent` can now be drag-and-dropped onto a `FileUploadComponent` to transfer its content
- `IncrementalMiner` now has a `clearCache` method that clears the cached synthesis results
- `PetriNetReachabilityService` was added
  - can compute all reachable markings of a Petri net
  - can compute all markings reachable by executing provided traces in a Petri net with no label splitting
- `Marking` class has new methods
  - `serialise` method that produces a comma separated string containing the marking of the places with the provided transition ids
  - `isNSafe` method that checks if the marking values of all places are smaller than or equal to the argument
- New utility function `arraysContainSameElements` checks if two Arrays have the same size and contain the same elements

### Changed
- Displaying a Petri net
  - `PnDisplayComponent` has been moved into its own Angular module - `PnDisplayModule`
  - Mouse cursor changes when hovering over a draggable element
  - Mouse cursor changes when dragging
  - The display area can be zoomed into using the mouse wheel and panned by dragging the background infinitely in all directions
- Performance improvements in `LogToPartialOrderTransformerService`
- `ImplicitPlaceRemoverService` had its algorithm updated


### Fixed
- SVG token in a marked place no longer blocks the click event for its place
- If a singular run is selected in the incremental miner and it contains label splitting it will now be passed by itself into the synthesis algorithm to remove label splitting
- Fixed a bug in `PartialOrderIsomorphismService`
- The I ❤ Petri nets header now redirects correctly in the `PageLayoutComponent` when using Angular router
- Petri net now fires transitions with self-loops correctly

### Removed
- `PnLayoutingService` was removed
  - Layout is now handled by the `LayoutManager` classes created by the `LayoutManagerFactory` services

## 1.2.0 - 2023-04-11
### Added
- Petri net regions / Token trails algorithms implemented
  - `TokenTrailIlpSolver` contains common implementations of ILP constraints for the Token trail semantics
  - `TokenTrailValidator` builds upon this solver, to decide the net language inclusion problem
  - `IncrementalMiner` allows interactive mining of a Petri net in incremental steps 
    - Instances should be created via the `IncrementalMinerFactoryService`
    - A single instance can operate on a single set of specifications at the same time
      - intermediary results are cached
      - A new set of specifications can be supplied to the miner, clearing the previous cached results
- `IlpnAlgorithmsModule`
  - contains the definitions of most services that deal with ILPs
  - `ILPN_DEBUG_CONFIG` injection token was added, that can configure debugging options of the algorithms contained in the module
- A `MapArray<K,V>` utility class, representing a `Map<K,Array<V>>` has been added
- `ExternalRedirectHookGuard` has been added, to allow bypassing Angular router when redirecting to relative URLs that are not handled by an Angular single-page application
  

### Changed
- `FileUploadComponent`
  - file upload dialog now opens on click
  - cursor changes on hover to indicate, that the component can be clicked
- `ArcWeightIlpSolver` - source file name changed to kebab-case
- `glpk.js`
  - services that use the `glpk.js` solver, now accept configuration objects that configure the message level of the solver
  - types and interfaces used by this library to create inputs and outputs for the solver are now exported
- `PnDisplayComponent` rewrite
  - Petri net related classes now contain no information related to their layout (eg. X and Y coordinates)
  - A new set of wrapper classes (`SvgPetriNet`, `SvgPlace`, `SvgTransition` ...) has been added to hold this information
  - The SVG Places can react to user inputs (such as click events) and the display component emits these events
  - The SVG Places can be filled with a specified color passed via the display component
  - Markings with less than 10 tokens are now displayed as black dots inside the places
- `LogToPartialOrderTransformerService` the resulting partial order nets now contain tokens in the places, that correspond to the initial state
- `RegionIlpSolver`, `RegionSynthesiser` & `Region`
  - `Region` classes have been renamed to `PetriNetRegion` 
  - The region solver now accepts multiple nets as inputs
    - It is no longer necessary to merge multiple net instances into a single net
  - the `PetriNetRegion` now contains information about the input nets, the markings of these nets that are the region, rises of all labels and an index into the nets, where the initial state can be read
- `RegionsConfiguration` - `oneBoundRegions` was changed to `noArcWeights`. This change is equivalent for most intents and purposes
- `PnLayoutingService` - Sugiyama remove cycles method has been made more consistent

### Removed
- `PnRendererService` used to create SVG Element objects for displaying Petri nets. This functionality is now contained in the new SVG wrapper classes
- `NetUnionResult` has been removed
  - The `PetriNet.netUnion()` static method now returns a `PetriNet` instance instead. Place ids of the second argument net, can be prefixed, to distinguish the two nets in the result
- `PetriNetRegionTransformerService` has been removed
  - The `applyMarking` method in `PetriNet` and the new `PetriNetRegion` representation can be used to achieve similar results

## 1.1.0 - 2022-12-16
### Added
- Changelog was added to the project
- `BranchingProcessFoldingService` has been added to the project
  - It can fold multiple partial orders represented as Petri nets into a single branching process Petri net structure in a simplistic way
- `DuplicatePlaceRemoverService` has been added to the project
  - It removes places from a Petri net, if the net already contains a place with the same pre-/post-set
  - It does NOT consider marking of the places
- An `equals` method has been added to the `Trace` class
- New methods have been added to the `PetriNet` class that allow getting of the in- and out-put places as Arrays instead of Sets
- `DirectlyFollowsExtractor` has been added to the project
  - It consumes a set of follows pairs and can then return only those pairs that directly follow each other in only one direction
- `ArcWeightIlpSolver` has been added to the project
  - It adds utility for building integer linear programms that contain in- and out-going arc weights of Petri net transitions as variables
- A simple implementation of the ILP miner algorithm has been added to the project
  - The miner is made available via the `IlpMinerService`
  - The solver that constructs and solves the integer linear program is implemented in the `IlpMinerIlpSolver` class
- An implementation of the ILP² miner algorithm has been added to the project
  - The miner is made available via the `Ilp2MinerService`
  - The solver that constructs and solves the integer linear program is implemented in the `Ilp2MinerIlpSolver` class
- `IlpSolverService` has been added to the project
  - It makes an instance of the glpk ILP solver available for various algorithms
  - The `PetriNetRegionsService` has been updated to reflect this change
- `TraceMultisetEquivalentStateTraverser` has been added to the project
  - It allows the traversal and construction of a reachability graph, where every state is represented by the multiset of labels that were observed to reach the state


### Changed
- The `LogCleaner` abstract class has been removed in favour of simple functions
  - The `cleanLog` and `cleanTrace` function have been made available
  - The `AlphaOracleService`, `TimestampOracleService`, `AbelOracleService`, `LogToPartialOrderTransformerService` and `ImplicitPlaceRemoverService` have been updated to reflect this change
- The `START_SYMBOL` and `STOP_SYMBOL` public static constants have been removed from the `LogToPartialOrderTransformerService` and made available through a new `LogSymbol` enum
- The `PetriNetIsomorphismService` can now return an isomorphic mapping if it exists
- Refactored the `RegionIlpSolver` class
  - the methods that build generic ILP constraints have been extracted into a new abstract `IlpSolver` class
- The `InfoCardComponent` has been made wider and a small padding has been added to the bottom
- The `LogToPartialOrderTransformerService` has been made more time and space efficient (even thought there is still room for future improvements)


### Fixed
- fixed a bug in the `PartialOrderIsomorphismService` that prevented an event with multiple predecessors to be resolved correctly
