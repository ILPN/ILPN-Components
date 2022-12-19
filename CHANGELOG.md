# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

[//]: # (## Unreleased)

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
