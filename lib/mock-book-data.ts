// Mock data para un libro completo con múltiples capítulos

export interface Book {
  id: string
  title: string
  author: string
  description: string
  coverImage: string
  totalChapters: number
  chapters: Chapter[]
}

export interface Chapter {
  id: string
  number: number
  title: string
  content: string
  wordCount: number
  estimatedReadingTime: number // en minutos
}

export const mockBook: Book = {
  id: 'designing-data-intensive-apps',
  title: 'Designing Data-Intensive Applications',
  author: 'Martin Kleppmann',
  description: 'The big ideas behind reliable, scalable, and maintainable systems',
  coverImage: '/covers/ddia.jpg',
  totalChapters: 12,
  chapters: [
    {
      id: 'chapter-1',
      number: 1,
      title: 'Reliable, Scalable, and Maintainable Applications',
      wordCount: 4200,
      estimatedReadingTime: 18,
      content: `
        <h2>Reliable, Scalable, and Maintainable Applications</h2>

        <p>The Internet was done so well that most people think of it as a natural resource like the Pacific Ocean, rather than something that was man-made. When was the last time a technology with a scale like that was so error-free?</p>

        <p>Many applications today are data-intensive, as opposed to compute-intensive. Raw CPU power is rarely a limiting factor for these applications—bigger problems are usually the amount of data, the complexity of data, and the speed at which it is changing.</p>

        <p>A data-intensive application is typically built from standard building blocks that provide commonly needed functionality. For example, many applications need to:</p>

        <ul>
          <li>Store data so that they, or another application, can find it again later (databases)</li>
          <li>Remember the result of an expensive operation, to speed up reads (caches)</li>
          <li>Allow users to search data by keyword or filter it in various ways (search indexes)</li>
          <li>Send a message to another process, to be handled asynchronously (stream processing)</li>
          <li>Periodically crunch a large amount of accumulated data (batch processing)</li>
        </ul>

        <h3>Thinking About Data Systems</h3>

        <p>We typically think of databases, queues, caches, etc. as being very different categories of tools. Although a database and a message queue have some superficial similarity—both store data for some time—they have very different access patterns, which means different performance characteristics, and thus very different implementations.</p>

        <p>So why should we lump them all together under an umbrella term like data systems?</p>

        <p>Many new tools for data storage and processing have emerged in recent years. They are optimized for a variety of different use cases, and they no longer neatly fit into traditional categories. For example, there are datastores that are also used as message queues (Redis), and there are message queues with database-like durability guarantees (Apache Kafka).</p>

        <h3>Reliability</h3>

        <p>For software, typical expectations include:</p>

        <ul>
          <li>The application performs the function that the user expected.</li>
          <li>It can tolerate the user making mistakes or using the software in unexpected ways.</li>
          <li>Its performance is good enough for the required use case, under the expected load and data volume.</li>
          <li>The system prevents any unauthorized access and abuse.</li>
        </ul>

        <p>If all those things together mean "working correctly," then we can understand reliability as meaning, roughly, "continuing to work correctly, even when things go wrong."</p>

        <p>The things that can go wrong are called faults, and systems that anticipate faults and can cope with them are called fault-tolerant or resilient. Note that a fault is not the same as a failure. A fault is usually defined as one component of the system deviating from its spec, whereas a failure is when the system as a whole stops providing the required service to the user.</p>
      `
    },
    {
      id: 'chapter-2',
      number: 2,
      title: 'Data Models and Query Languages',
      wordCount: 5100,
      estimatedReadingTime: 22,
      content: `
        <h2>Data Models and Query Languages</h2>

        <p>Data models are perhaps the most important part of developing software, because they have such a profound effect: not only on how the software is written, but also on how we think about the problem that we are solving.</p>

        <p>Most applications are built by layering one data model on top of another. For each layer, the key question is: how is it represented in terms of the next-lower layer?</p>

        <ol>
          <li>As an application developer, you look at the real world and model it in terms of objects or data structures, and APIs that manipulate those data structures.</li>
          <li>When you want to store those data structures, you express them in terms of a general-purpose data model, such as JSON or XML documents, tables in a relational database, or a graph model.</li>
          <li>The engineers who built your database software decided on a way of representing that JSON/XML/relational/graph data in terms of bytes in memory, on disk, or on a network.</li>
          <li>On yet lower levels, hardware engineers have figured out how to represent bytes in terms of electrical currents, pulses of light, magnetic fields, and more.</li>
        </ol>

        <h3>Relational Model Versus Document Model</h3>

        <p>The best-known data model today is probably that of SQL, based on the relational model proposed by Edgar Codd in 1970: data is organized into relations (called tables in SQL), where each relation is an unordered collection of tuples (rows in SQL).</p>

        <p>The roots of relational databases lie in business data processing, which was performed on mainframe computers in the 1960s and '70s. The use cases appear mundane from today's perspective: typically transaction processing (entering sales or banking transactions, airline reservations, stock-keeping in warehouses) and batch processing (customer invoicing, payroll, reporting).</p>

        <h3>The Birth of NoSQL</h3>

        <p>In the 2010s, NoSQL is the latest attempt to overthrow the relational model's dominance. The name "NoSQL" is unfortunate, since it doesn't actually refer to any particular technology—it was originally intended simply as a catchy Twitter hashtag for a meetup on open source, distributed, nonrelational databases in 2009.</p>

        <p>There are several driving forces behind the adoption of NoSQL databases, including:</p>

        <ul>
          <li>A need for greater scalability than relational databases can easily achieve, including very large datasets or very high write throughput</li>
          <li>A widespread preference for free and open source software over commercial database products</li>
          <li>Specialized query operations that are not well supported by the relational model</li>
          <li>Frustration with the restrictiveness of relational schemas, and a desire for a more dynamic and expressive data model</li>
        </ul>
      `
    },
    {
      id: 'chapter-3',
      number: 3,
      title: 'Storage and Retrieval',
      wordCount: 6300,
      estimatedReadingTime: 27,
      content: `
        <h2>Storage and Retrieval</h2>

        <p>On the most fundamental level, a database needs to do two things: when you give it some data, it should store the data, and when you ask it again later, it should give the data back to you.</p>

        <p>Why should you, as an application developer, care how the database handles storage and retrieval internally? You're probably not going to implement your own storage engine from scratch, but you <em>do</em> need to select a storage engine that is appropriate for your application. In order to tune a storage engine to perform well on your kind of workload, you need to have a rough idea of what the storage engine is doing under the hood.</p>

        <p>In particular, there is a big difference between storage engines that are optimized for transactional workloads and those that are optimized for analytics. We will explore that distinction later in this chapter, but first we'll start by looking at two families of storage engines: log-structured storage engines and page-oriented storage engines such as B-trees.</p>

        <h3>Data Structures That Power Your Database</h3>

        <p>Consider the world's simplest database, implemented as two Bash functions:</p>

        <pre><code>#!/bin/bash

db_set () {
  echo "$1,$2" >> database
}

db_get () {
  grep "^$1," database | sed -e "s/^$1,//" | tail -n 1
}</code></pre>

        <p>These two functions implement a key-value store. You can call <code>db_set key value</code>, which will store key and value in the database. The key and value can be (almost) anything you like—for example, the value could be a JSON document. You can then call <code>db_get key</code>, which looks up the most recent value associated with that particular key and returns it.</p>

        <p>Our <code>db_set</code> function actually has pretty good performance for something that is so simple, because appending to a file is generally very efficient. Similarly to what <code>db_set</code> does, many databases internally use a <em>log</em>, which is an append-only data file.</p>

        <h3>Hash Indexes</h3>

        <p>Let's say our data storage consists only of appending to a file. Then the simplest possible indexing strategy is this: keep an in-memory hash map where every key is mapped to a byte offset in the data file—the location at which the value can be found.</p>

        <p>Whenever you append a new key-value pair to the file, you also update the hash map to reflect the offset of the data you just wrote. When you want to look up a value, use the hash map to find the offset in the data file, seek to that location, and read the value.</p>

        <h3>SSTables and LSM-Trees</h3>

        <p>We can now make a simple change to the format of our segment files: we require that the sequence of key-value pairs is sorted by key. We call this format Sorted String Table, or SSTable for short. We also require that each key only appears once within each merged segment file.</p>

        <p>SSTables have several big advantages over log segments with hash indexes:</p>

        <ul>
          <li>Merging segments is simple and efficient</li>
          <li>You no longer need to keep an index of all the keys in memory</li>
          <li>You can group records into blocks and compress them before writing to disk</li>
        </ul>
      `
    },
    {
      id: 'chapter-4',
      number: 4,
      title: 'Encoding and Evolution',
      wordCount: 4800,
      estimatedReadingTime: 21,
      content: `
        <h2>Encoding and Evolution</h2>

        <p>Applications inevitably change over time. Features are added or modified as new products are launched, user requirements become better understood, or business circumstances change. In most cases, a change to an application's features also requires a change to data that it stores.</p>

        <p>Relational databases generally assume that all data in the database conforms to one schema: although that schema can be changed, at any one point in time, there is exactly one schema in force. By contrast, schema-on-read ("schemaless") databases don't enforce a schema, so the database can contain a mixture of older and newer data formats.</p>

        <h3>Formats for Encoding Data</h3>

        <p>Programs usually work with data in (at least) two different representations:</p>

        <ol>
          <li>In memory, data is kept in objects, structs, lists, arrays, hash tables, trees, and so on. These data structures are optimized for efficient access and manipulation by the CPU (typically using pointers).</li>
          <li>When you want to write data to a file or send it over the network, you have to encode it as some kind of self-contained sequence of bytes (for example, a JSON document).</li>
        </ol>

        <p>Thus, we need some kind of translation between the two representations. The translation from the in-memory representation to a byte sequence is called encoding (also known as serialization or marshalling), and the reverse is called decoding (parsing, deserialization, unmarshalling).</p>

        <h3>Language-Specific Formats</h3>

        <p>Many programming languages come with built-in support for encoding in-memory objects into byte sequences. For example, Java has java.io.Serializable, Ruby has Marshal, Python has pickle, and so on.</p>

        <p>However, these encoding libraries have a number of problems:</p>

        <ul>
          <li>The encoding is often tied to a particular programming language</li>
          <li>The decoding process needs to be able to instantiate arbitrary classes</li>
          <li>Versioning data is often an afterthought</li>
          <li>Efficiency (CPU time and encoded size) is also often an afterthought</li>
        </ul>

        <h3>JSON, XML, and Binary Variants</h3>

        <p>JSON, XML, and CSV are textual formats, and thus somewhat human-readable. Besides the superficial syntactic issues, they also have some subtle problems:</p>

        <ul>
          <li>Ambiguity around the encoding of numbers</li>
          <li>JSON and XML have good support for Unicode character strings, but they don't support binary strings</li>
          <li>There is optional schema support for both XML and JSON</li>
          <li>CSV does not have any schema</li>
        </ul>
      `
    },
    {
      id: 'chapter-5',
      number: 5,
      title: 'Replication',
      wordCount: 7200,
      estimatedReadingTime: 31,
      content: `
        <h2>Replication</h2>

        <p>Replication means keeping a copy of the same data on multiple machines that are connected via a network. There are several reasons why you might want to replicate data:</p>

        <ul>
          <li>To keep data geographically close to your users (and thus reduce latency)</li>
          <li>To allow the system to continue working even if some of its parts have failed (and thus increase availability)</li>
          <li>To scale out the number of machines that can serve read queries (and thus increase read throughput)</li>
        </ul>

        <p>If the data that you're replicating does not change over time, then replication is easy: you just need to copy the data to every node once, and you're done. All of the difficulty in replication lies in handling changes to replicated data.</p>

        <h3>Leaders and Followers</h3>

        <p>Each node that stores a copy of the database is called a replica. With multiple replicas, a question inevitably arises: how do we ensure that all the data ends up on all the replicas?</p>

        <p>Every write to the database needs to be processed by every replica; otherwise, the replicas would no longer contain the same data. The most common solution for this is called leader-based replication (also known as active/passive or master–slave replication). It works as follows:</p>

        <ol>
          <li>One of the replicas is designated the leader (also known as master or primary). When clients want to write to the database, they must send their requests to the leader, which first writes the new data to its local storage.</li>
          <li>The other replicas are known as followers (read replicas, slaves, secondaries, or hot standbys). Whenever the leader writes new data to its local storage, it also sends the data change to all of its followers as part of a replication log or change stream.</li>
          <li>When a client wants to read from the database, it can query either the leader or any of the followers. However, writes are only accepted on the leader.</li>
        </ol>

        <h3>Synchronous Versus Asynchronous Replication</h3>

        <p>An important detail of a replicated system is whether the replication happens synchronously or asynchronously.</p>

        <p>The advantage of synchronous replication is that the follower is guaranteed to have an up-to-date copy of the data that is consistent with the leader. If the leader suddenly fails, we can be sure that the data is still available on the follower.</p>

        <p>The disadvantage is that if the synchronous follower doesn't respond (because it has crashed, or there is a network fault, or for any other reason), the write cannot be processed. The leader must block all writes and wait until the synchronous replica is available again.</p>
      `
    },
    {
      id: 'chapter-6',
      number: 6,
      title: 'Partitioning',
      wordCount: 5900,
      estimatedReadingTime: 25,
      content: `
        <h2>Partitioning</h2>

        <p>For very large datasets, or very high query throughput, replication is not sufficient: we need to break the data up into partitions, also known as sharding.</p>

        <p>Normally, partitions are defined in such a way that each piece of data (each record, row, or document) belongs to exactly one partition. There are various ways of achieving this. In effect, each partition is a small database of its own, although the database may support operations that touch multiple partitions at the same time.</p>

        <p>The main reason for wanting to partition data is scalability. Different partitions can be placed on different nodes in a shared-nothing cluster. Thus, a large dataset can be distributed across many disks, and the query load can be distributed across many processors.</p>

        <h3>Partitioning and Replication</h3>

        <p>Partitioning is usually combined with replication so that copies of each partition are stored on multiple nodes. This means that, even though each record belongs to exactly one partition, it may still be stored on several different nodes for fault tolerance.</p>

        <p>A node may store more than one partition. If a leader–follower replication model is used, the combination of partitioning and replication can look like this: each partition's leader is assigned to one node, and its followers are assigned to other nodes. Each node may be the leader for some partitions and a follower for other partitions.</p>

        <h3>Partitioning of Key-Value Data</h3>

        <p>How do you decide which records to store on which nodes?</p>

        <p>Our goal with partitioning is to spread the data and the query load evenly across nodes. If every node takes a fair share, then—in theory—10 nodes should be able to handle 10 times as much data and 10 times the read and write throughput of a single node.</p>

        <p>If the partitioning is unfair, so that some partitions have more data or queries than others, we call it skewed. The presence of skew makes partitioning much less effective. In an extreme case, all the load could end up on one partition, so 9 out of 10 nodes are idle and your bottleneck is the single busy node.</p>

        <h3>Partitioning by Key Range</h3>

        <p>One way of partitioning is to assign a continuous range of keys to each partition. If you know the boundaries between the ranges, you can easily determine which partition contains a given key.</p>

        <p>The ranges of keys are not necessarily evenly spaced, because your data may not be evenly distributed. In order to distribute the data evenly, the partition boundaries need to adapt to the data.</p>
      `
    },
    {
      id: 'chapter-7',
      number: 7,
      title: 'Transactions',
      wordCount: 8100,
      estimatedReadingTime: 35,
      content: `
        <h2>Transactions</h2>

        <p>In the harsh reality of data systems, many things can go wrong:</p>

        <ul>
          <li>The database software or hardware may fail at any time (including in the middle of a write operation)</li>
          <li>The application may crash at any time (including halfway through a series of operations)</li>
          <li>Interruptions in the network can unexpectedly cut off the application from the database, or one database node from another</li>
          <li>Several clients may write to the database at the same time, overwriting each other's changes</li>
          <li>A client may read data that doesn't make sense because it has only partially been updated</li>
          <li>Race conditions between clients can cause surprising bugs</li>
        </ul>

        <p>For decades, transactions have been the mechanism of choice for simplifying these issues. A transaction is a way for an application to group several reads and writes together into a logical unit.</p>

        <h3>The Meaning of ACID</h3>

        <p>The safety guarantees provided by transactions are often described by the well-known acronym ACID, which stands for Atomicity, Consistency, Isolation, and Durability.</p>

        <h4>Atomicity</h4>

        <p>In general, atomic refers to something that cannot be broken down into smaller parts. In the context of ACID, atomicity is not about concurrency. It describes what happens if a client wants to make several writes, but a fault occurs after some of the writes have been processed.</p>

        <p>If the writes are grouped together into an atomic transaction, and the transaction cannot be completed (committed) due to a fault, then the transaction is aborted and the database must discard or undo any writes it has made so far in that transaction.</p>

        <h4>Consistency</h4>

        <p>The idea of consistency is that you have certain statements about your data (invariants) that must always be true. However, this idea of consistency depends on the application's notion of invariants, and it's the application's responsibility to define its transactions correctly so that they preserve consistency.</p>

        <h4>Isolation</h4>

        <p>Most databases are accessed by several clients at the same time. That is no problem if they are reading and writing different parts of the database, but if they are accessing the same database records, you can run into concurrency problems.</p>

        <p>Isolation in the sense of ACID means that concurrently executing transactions are isolated from each other: they cannot step on each other's toes.</p>

        <h4>Durability</h4>

        <p>Durability is the promise that once a transaction has committed successfully, any data it has written will not be forgotten, even if there is a hardware fault or the database crashes.</p>
      `
    },
    {
      id: 'chapter-8',
      number: 8,
      title: 'The Trouble with Distributed Systems',
      wordCount: 6700,
      estimatedReadingTime: 29,
      content: `
        <h2>The Trouble with Distributed Systems</h2>

        <p>Working with distributed systems is fundamentally different from writing software on a single computer—and the main difference is that there are lots of new and exciting ways for things to go wrong.</p>

        <p>In this chapter, we will get a taste of the problems that arise in practice, and an understanding of the things we can and cannot rely on. Ultimately, our task as engineers is to build systems that do their job despite everything going wrong.</p>

        <h3>Faults and Partial Failures</h3>

        <p>When you are writing a program on a single computer, it normally behaves in a fairly predictable way: either it works or it doesn't. There is no fundamental reason why software on a single computer should be flaky: when the hardware is working correctly, the same operation always produces the same result.</p>

        <p>In a distributed system, there may well be some parts of the system that are broken in some unpredictable way, even though other parts of the system are working fine. This is known as a partial failure. The difficulty is that partial failures are nondeterministic.</p>

        <h3>Unreliable Networks</h3>

        <p>The distributed systems we focus on in this book are shared-nothing systems: i.e., a bunch of machines connected by a network. The network is the only way those machines can communicate.</p>

        <p>The internet and most internal networks in datacenters are asynchronous packet networks. In this kind of network, one node can send a message (a packet) to another node, but the network gives no guarantees as to when it will arrive, or whether it will arrive at all.</p>

        <p>If you send a request and expect a response, many things could go wrong:</p>

        <ul>
          <li>Your request may have been lost</li>
          <li>Your request may be waiting in a queue and will be delivered later</li>
          <li>The remote node may have failed</li>
          <li>The remote node may have temporarily stopped responding</li>
          <li>The remote node may have processed your request, but the response has been lost on the network</li>
          <li>The remote node may have processed your request, but the response has been delayed</li>
        </ul>

        <h3>Unreliable Clocks</h3>

        <p>Clocks and time are important. Applications depend on clocks in various ways to answer questions like the following:</p>

        <ul>
          <li>Has this request timed out yet?</li>
          <li>What's the 99th percentile response time of this service?</li>
          <li>How many queries per second did this service handle on average in the last five minutes?</li>
          <li>How long did the user spend on our site?</li>
          <li>When was this article published?</li>
        </ul>

        <p>In a distributed system, time is a tricky business, because communication is not instantaneous: it takes time for a message to travel across the network from one machine to another.</p>
      `
    },
    {
      id: 'chapter-9',
      number: 9,
      title: 'Consistency and Consensus',
      wordCount: 7800,
      estimatedReadingTime: 33,
      content: `
        <h2>Consistency and Consensus</h2>

        <p>Is it better to be alive and wrong, or right and dead? The best answer is alive and right, but that is not always an option.</p>

        <p>In this chapter, we will explore algorithms and protocols for building fault-tolerant distributed systems. We will assume that all the problems from the previous chapter can occur: packets can be lost, reordered, duplicated, or arbitrarily delayed in the network; clocks are approximate at best; and nodes can pause or crash at any time.</p>

        <h3>Consistency Guarantees</h3>

        <p>Most replicated databases provide at least eventual consistency, which means that if you stop writing to the database and wait for some unspecified length of time, then eventually all read requests will return the same value.</p>

        <p>However, this is a very weak guarantee—it doesn't say anything about when the replicas will converge. Until the time of convergence, reads could return anything or nothing.</p>

        <h3>Linearizability</h3>

        <p>In an eventually consistent database, if you ask two different replicas the same question at the same time, you may get two different answers. That's confusing. Wouldn't it be a lot simpler if the database could give the illusion that there is only one replica?</p>

        <p>This is the idea behind linearizability (also known as atomic consistency, strong consistency, immediate consistency, or external consistency). The exact definition is subtle, but the basic idea is to make a system appear as if there were only one copy of the data, and all operations on it are atomic.</p>

        <h3>Ordering Guarantees</h3>

        <p>Ordering has been a recurring theme in this book, which suggests that it might be an important fundamental idea. Let's briefly recap some of the contexts in which we have discussed ordering:</p>

        <ul>
          <li>The order in which a single-threaded program executes</li>
          <li>The order of writes in a leader-based replication log</li>
          <li>The ordering of events in a partially ordered or totally ordered event log</li>
          <li>Serializability in transactions</li>
        </ul>

        <h3>Distributed Transactions and Consensus</h3>

        <p>Consensus is one of the most important and fundamental problems in distributed computing. On the surface, it seems simple: informally, the goal is simply to get several nodes to agree on something.</p>

        <p>There are a number of situations in which it is important for nodes to agree. For example:</p>

        <ul>
          <li>Leader election</li>
          <li>Atomic commit</li>
        </ul>
      `
    },
    {
      id: 'chapter-10',
      number: 10,
      title: 'Batch Processing',
      wordCount: 6400,
      estimatedReadingTime: 28,
      content: `
        <h2>Batch Processing</h2>

        <p>In the first two parts of this book we talked a lot about requests and queries, and the corresponding responses or results. This style of data processing is assumed in many modern data systems: you ask for something, or you send an instruction, and some time later the system (hopefully) gives you an answer.</p>

        <p>However, this is not the only way of building systems. There is another approach, which is to take a large amount of data, run a job to process it, and produce some output data.</p>

        <h3>Batch Processing with Unix Tools</h3>

        <p>Let's start with a simple example. Say you have a web server that appends a line to a log file every time it serves a request. For example, using the nginx default access log format, one line of the log might look like this:</p>

        <pre><code>216.58.210.78 - - [27/Feb/2015:17:55:11 +0000] "GET /css/typography.css HTTP/1.1" 200 3377 "http://martin.kleppmann.com/" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36"</code></pre>

        <p>There's a lot of information in that line. In order to interpret it, you need to look at the definition of the log format. But what you can see from a glance is:</p>

        <ul>
          <li>The IP address of the client</li>
          <li>The timestamp of the request</li>
          <li>The requested URL</li>
          <li>The HTTP status code</li>
          <li>The size of the response</li>
        </ul>

        <h3>MapReduce and Distributed Filesystems</h3>

        <p>MapReduce is a bit like Unix tools, but distributed across potentially thousands of machines. Like Unix tools, it is a fairly blunt, brute-force, but surprisingly effective tool.</p>

        <p>A single MapReduce job is comparable to a single Unix process: it takes one or more inputs and produces one or more outputs. A MapReduce job does not modify the input and does not have any side effects other than producing the output.</p>

        <p>While Unix tools use stdin and stdout as input and output, MapReduce jobs read and write files on a distributed filesystem. In Hadoop's implementation of MapReduce, that filesystem is called HDFS (Hadoop Distributed File System).</p>

        <h3>Beyond MapReduce</h3>

        <p>Although MapReduce became very popular and received a lot of hype in the late 2000s, it is just one among many possible programming models for distributed systems. Depending on the volume of data, the structure of the data, and the type of processing being done, other tools may be more appropriate.</p>
      `
    },
    {
      id: 'chapter-11',
      number: 11,
      title: 'Stream Processing',
      wordCount: 7500,
      estimatedReadingTime: 32,
      content: `
        <h2>Stream Processing</h2>

        <p>In the previous chapter we discussed batch processing, where the input is bounded—i.e., of a known and finite size—so the batch process knows when it has finished reading its input. For example, MapReduce jobs read a set of files on the distributed filesystem and produce a set of output files.</p>

        <p>In this chapter we turn to stream processing, where the input is unbounded—i.e., you still have a job, but its inputs are never-ending streams of data. In this case, a job is never complete, because at any time there may be more work coming in.</p>

        <h3>Transmitting Event Streams</h3>

        <p>In the batch processing world, the inputs and outputs of a job are files. What does the streaming equivalent look like?</p>

        <p>When the input is a file, the first processing step is usually to parse it into records. In a stream processing context, a record is more commonly known as an event, but it is essentially the same thing: a small, self-contained, immutable object containing the details of something that happened at some point in time.</p>

        <p>An event is generated once by a producer (also known as a publisher or sender), and then potentially processed by multiple consumers (subscribers or recipients).</p>

        <h3>Messaging Systems</h3>

        <p>A common approach for notifying consumers about new events is to use a messaging system: a producer sends a message containing the event, which is then pushed to consumers.</p>

        <p>Within this publish/subscribe model, different systems take a wide range of approaches, and there is no one right answer for all purposes. To differentiate the systems, it is particularly helpful to ask the following two questions:</p>

        <ol>
          <li>What happens if the producers send messages faster than the consumers can process them?</li>
          <li>What happens if nodes crash or temporarily go offline—are any messages lost?</li>
        </ol>

        <h3>Databases and Streams</h3>

        <p>We have drawn some comparisons between message brokers and databases. Even though they have traditionally been considered separate categories of tools, we saw that log-based message brokers have been successful in taking ideas from databases and applying them to messaging.</p>

        <p>In this section we will go in the opposite direction: we will explore ideas from messaging and streams, and apply them to databases.</p>

        <h3>Processing Streams</h3>

        <p>What remains is to discuss what you can do with the stream once you have it—namely, how you can process it. Broadly, there are three options:</p>

        <ol>
          <li>You can take the data in the events and write it to a database, cache, search index, or similar storage system</li>
          <li>You can push the events to users in some way, for example by sending email alerts or push notifications</li>
          <li>You can process one or more input streams to produce one or more output streams</li>
        </ol>
      `
    },
    {
      id: 'chapter-12',
      number: 12,
      title: 'The Future of Data Systems',
      wordCount: 5600,
      estimatedReadingTime: 24,
      content: `
        <h2>The Future of Data Systems</h2>

        <p>In this final chapter, we will take a step back and think about the bigger picture of building systems that can grow and evolve. The applications we build today will need to be maintained for many years to come. Keeping software running smoothly requires ongoing effort.</p>

        <h3>Data Integration</h3>

        <p>Throughout this book, we have discussed various kinds of data systems: relational databases, document databases, key-value stores, search indexes, message queues, caches, data warehouses, and more. Each of these systems has its own query language, its own characteristics, and its own trade-offs.</p>

        <p>In practice, most applications need to do several different things with their data, which may mean that several different tools need to be used together. For example, an application might:</p>

        <ul>
          <li>Use a relational database for transaction processing</li>
          <li>Use a cache to speed up common read requests</li>
          <li>Use a full-text search index for keyword search</li>
          <li>Use a data warehouse for analytics</li>
        </ul>

        <h3>Unbundling Databases</h3>

        <p>At a most abstract level, databases, Hadoop, and operating systems all perform the same functions: they store some data, and they allow you to process and query that data. A database stores data in records of some data model (rows in tables, documents, vertices in a graph, etc.), while a filesystem stores data in files.</p>

        <h3>Aiming for Correctness</h3>

        <p>With stateless services, we can often get away with just restarting things when they go wrong, because the service doesn't keep any persistent state. However, with stateful systems such as databases, the situation is much more complicated. We need to think carefully about what happens when things go wrong.</p>

        <h3>Doing the Right Thing</h3>

        <p>Throughout this book, we have focused on the technical aspects of designing data systems. But technology is not developed in a vacuum: we make decisions about software in the context of the society we live in.</p>

        <p>Many datasets are about people: their behavior, their interests, their identity. We must treat such data with humanity and respect. The fact that the data is in digital form does not make it any less personal or sensitive.</p>

        <p>If we ignore this responsibility, we are liable to make technology that does more harm than good. When building systems that work with personal data, we should always be asking ourselves: What are the consequences of this work?</p>
      `
    }
  ]
}

// Funciones helper para trabajar con el mock

export function getChapterById(chapterId: string): Chapter | undefined {
  return mockBook.chapters.find(ch => ch.id === chapterId)
}

export function getChapterByNumber(chapterNumber: number): Chapter | undefined {
  return mockBook.chapters.find(ch => ch.number === chapterNumber)
}

export function getNextChapter(currentChapterId: string): Chapter | undefined {
  const currentChapter = getChapterById(currentChapterId)
  if (!currentChapter) return undefined

  return getChapterByNumber(currentChapter.number + 1)
}

export function getPreviousChapter(currentChapterId: string): Chapter | undefined {
  const currentChapter = getChapterById(currentChapterId)
  if (!currentChapter) return undefined

  return getChapterByNumber(currentChapter.number - 1)
}

export function getChapterProgress(chapterId: string): number {
  const chapter = getChapterById(chapterId)
  if (!chapter) return 0

  return Math.round((chapter.number / mockBook.totalChapters) * 100)
}
